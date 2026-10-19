from __future__ import annotations

import ctypes
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent


class FpgaError(RuntimeError):
    pass


class PurePythonBackend:
    FPGA_REG_STATUS = 1
    FPGA_REG_LEN = 2
    FPGA_OP_VECTOR_ADD = 1
    FPGA_STATUS_BUSY = 1
    FPGA_STATUS_DONE = 2
    FPGA_STATUS_ERROR = 4

    def __init__(self, capacity: int) -> None:
        self.capacity = capacity
        self.registers = [0] * 8
        self.input_a = [0] * capacity
        self.input_b = [0] * capacity
        self.output = [0] * capacity
        self.length = 0

    def fpga_destroy(self, device) -> None:
        return None

    def fpga_load_input_a(self, device, values: list[int], length: int) -> int:
        if length == 0 or length > self.capacity:
            self.registers[self.FPGA_REG_STATUS] = self.FPGA_STATUS_ERROR
            return -1
        self.input_a[:length] = values[:length]
        self.length = length
        self.registers[self.FPGA_REG_LEN] = length
        return 0

    def fpga_load_input_b(self, device, values: list[int], length: int) -> int:
        if length == 0 or length > self.capacity:
            self.registers[self.FPGA_REG_STATUS] = self.FPGA_STATUS_ERROR
            return -1
        self.input_b[:length] = values[:length]
        self.length = length
        self.registers[self.FPGA_REG_LEN] = length
        return 0

    def fpga_start(self, device, op_code: int) -> int:
        if self.length == 0:
            return -1

        self.registers[self.FPGA_REG_STATUS] = self.FPGA_STATUS_BUSY

        if op_code == self.FPGA_OP_VECTOR_ADD:
            for index in range(self.length):
                self.output[index] = self.input_a[index] + self.input_b[index]
        else:
            self.registers[self.FPGA_REG_STATUS] = self.FPGA_STATUS_ERROR
            return -2

        self.registers[self.FPGA_REG_STATUS] = self.FPGA_STATUS_DONE
        return 0

    def fpga_read_output(self, device, length: int) -> list[int]:
        return self.output[:length]

    def fpga_read_register(self, device, reg_index: int) -> int:
        if reg_index >= len(self.registers):
            return 0
        return self.registers[reg_index]

    def fpga_write_register(self, device, reg_index: int, value: int) -> None:
        if reg_index < len(self.registers):
            self.registers[reg_index] = value

    def fpga_reset(self, device) -> None:
        self.registers = [0] * len(self.registers)
        self.length = 0
        self.input_a = [0] * self.capacity
        self.input_b = [0] * self.capacity
        self.output = [0] * self.capacity


class FpgaDevice:
    FPGA_REG_STATUS = 1
    FPGA_REG_LEN = 2
    FPGA_OP_VECTOR_ADD = 1
    FPGA_STATUS_BUSY = 1
    FPGA_STATUS_DONE = 2
    FPGA_STATUS_ERROR = 4

    def __init__(self, capacity: int = 16) -> None:
        self.capacity = capacity
        self._device = None
        self._library = None
        self._backend = None

        try:
            self._library = self._load_or_build_library()
            self._configure_signatures()
            self._device = self._library.fpga_create(ctypes.c_size_t(capacity))
            if not self._device:
                raise FpgaError("fpga_create failed")
            self._backend_kind = "c"
        except FpgaError:
            self._backend = PurePythonBackend(capacity)
            self._backend_kind = "python"

    def close(self) -> None:
        if self._library and getattr(self, "_device", None):
            self._library.fpga_destroy(self._device)
            self._device = None

    def __enter__(self) -> "FpgaDevice":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    @staticmethod
    def _library_path() -> Path:
        if sys.platform == "win32":
            return ROOT / "fpga_backend.dll"
        if sys.platform == "darwin":
            return ROOT / "libfpga_backend.dylib"
        return ROOT / "libfpga_backend.so"

    @classmethod
    def _load_or_build_library(cls) -> ctypes.CDLL:
        library_path = cls._library_path()
        if not library_path.exists():
            cls._build_library(library_path)
        try:
            return ctypes.CDLL(str(library_path))
        except OSError as exc:
            raise FpgaError(f"Could not load backend library: {library_path}") from exc

    @staticmethod
    def _build_library(library_path: Path) -> None:
        source_path = ROOT / "fpga_backend.c"
        if not source_path.exists():
            raise FpgaError(f"Missing backend source: {source_path}")

        if sys.platform == "win32":
            command = [
                "cl",
                "/LD",
                "/O2",
                str(source_path),
                "/Fe:" + str(library_path),
            ]
        else:
            command = [
                "cc",
                "-O2",
                "-shared",
                "-fPIC",
                str(source_path),
                "-o",
                str(library_path),
            ]

        try:
            subprocess.run(command, check=True, cwd=ROOT)
        except (OSError, subprocess.CalledProcessError) as exc:
            raise FpgaError(
                "Could not build the C backend automatically. "
                "Compile fpga_backend.c into a shared library next to this file."
            ) from exc

    def _configure_signatures(self) -> None:
        self._library.fpga_create.restype = ctypes.c_void_p
        self._library.fpga_create.argtypes = [ctypes.c_size_t]

        self._library.fpga_destroy.restype = None
        self._library.fpga_destroy.argtypes = [ctypes.c_void_p]

        self._library.fpga_load_input_a.restype = ctypes.c_int
        self._library.fpga_load_input_a.argtypes = [
            ctypes.c_void_p,
            ctypes.POINTER(ctypes.c_uint32),
            ctypes.c_size_t,
        ]

        self._library.fpga_load_input_b.restype = ctypes.c_int
        self._library.fpga_load_input_b.argtypes = [
            ctypes.c_void_p,
            ctypes.POINTER(ctypes.c_uint32),
            ctypes.c_size_t,
        ]

        self._library.fpga_start.restype = ctypes.c_int
        self._library.fpga_start.argtypes = [ctypes.c_void_p, ctypes.c_uint32]

        self._library.fpga_read_output.restype = ctypes.c_int
        self._library.fpga_read_output.argtypes = [
            ctypes.c_void_p,
            ctypes.POINTER(ctypes.c_uint32),
            ctypes.c_size_t,
        ]

        self._library.fpga_read_register.restype = ctypes.c_uint32
        self._library.fpga_read_register.argtypes = [ctypes.c_void_p, ctypes.c_uint32]

        self._library.fpga_write_register.restype = None
        self._library.fpga_write_register.argtypes = [ctypes.c_void_p, ctypes.c_uint32, ctypes.c_uint32]

        self._library.fpga_reset.restype = None
        self._library.fpga_reset.argtypes = [ctypes.c_void_p]

    def _require_ok(self, code: int, action: str) -> None:
        if code != 0:
            raise FpgaError(f"{action} failed with code {code}")

    def _using_python_backend(self) -> bool:
        return self._backend is not None

    def load_vector_add_inputs(self, left: list[int], right: list[int]) -> None:
        if len(left) != len(right):
            raise FpgaError("Input vectors must have the same length")
        if len(left) > self.capacity:
            raise FpgaError("Input vectors exceed device capacity")

        if self._using_python_backend():
            self._require_ok(self._backend.fpga_load_input_a(self._device, left, len(left)), "load input A")
            self._require_ok(self._backend.fpga_load_input_b(self._device, right, len(right)), "load input B")
            return

        left_buffer = (ctypes.c_uint32 * len(left))(*left)
        right_buffer = (ctypes.c_uint32 * len(right))(*right)
        self._require_ok(self._library.fpga_load_input_a(self._device, left_buffer, len(left)), "load input A")
        self._require_ok(self._library.fpga_load_input_b(self._device, right_buffer, len(right)), "load input B")

    def start_vector_add(self) -> None:
        if self._using_python_backend():
            self._require_ok(
                self._backend.fpga_start(self._device, self.FPGA_OP_VECTOR_ADD),
                "start accelerator",
            )
            return

        self._require_ok(
            self._library.fpga_start(self._device, self.FPGA_OP_VECTOR_ADD),
            "start accelerator",
        )

    def wait_until_done(self) -> None:
        if self._using_python_backend():
            status = self._backend.fpga_read_register(self._device, self.FPGA_REG_STATUS)
            if status == self.FPGA_STATUS_ERROR:
                raise FpgaError("Device entered error state")
            if status != self.FPGA_STATUS_DONE:
                raise FpgaError(f"Unexpected device status: {status}")
            return

        status = self._library.fpga_read_register(self._device, self.FPGA_REG_STATUS)
        if status == self.FPGA_STATUS_ERROR:
            raise FpgaError("Device entered error state")
        while status == self.FPGA_STATUS_BUSY:
            status = self._library.fpga_read_register(self._device, self.FPGA_REG_STATUS)
        if status != self.FPGA_STATUS_DONE:
            raise FpgaError(f"Unexpected device status: {status}")

    def read_output(self) -> list[int]:
        if self._using_python_backend():
            length = int(self._backend.fpga_read_register(self._device, self.FPGA_REG_LEN))
            return [int(value) for value in self._backend.fpga_read_output(self._device, length)]

        length = int(self._library.fpga_read_register(self._device, self.FPGA_REG_LEN))
        buffer = (ctypes.c_uint32 * length)()
        self._require_ok(self._library.fpga_read_output(self._device, buffer, length), "read output")
        return [int(value) for value in buffer]

    def vector_add(self, left: list[int], right: list[int]) -> list[int]:
        self.load_vector_add_inputs(left, right)
        self.start_vector_add()
        self.wait_until_done()
        return self.read_output()


def demo() -> None:
    left = [3, 7, 11, 19]
    right = [1, 2, 5, 8]

    with FpgaDevice(capacity=16) as fpga:
        result = fpga.vector_add(left, right)
        print("Input A:", left)
        print("Input B:", right)
        print("Result :", result)


if __name__ == "__main__":
    demo()
