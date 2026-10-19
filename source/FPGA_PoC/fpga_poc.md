# FPGA PoC

Small proof of concept for a fake FPGA accelerator.

The setup is intentionally split into two layers:

- C backend: simulates a tiny FPGA device with registers, buffers, and a vector-add accelerator.
- Python frontend: loads the backend via `ctypes` and provides a high-level API.

## What it demonstrates

- register-style control flow (`CTRL`, `STATUS`, `LEN`)
- buffer upload and result retrieval
- polling for completion like a real accelerator driver
- a clean Python wrapper around a low-level C backend

## Files

- `fpga_backend.c`: simulated hardware backend
- `fpga_frontend.py`: Python API and demo entrypoint

## Run

The demo will try to compile and load the C backend automatically when a compiler is available.
If that is not possible, it falls back to a pure Python simulation with the same API so the PoC still runs.

Then run the Python demo:

```bash
python fpga_frontend.py
```

## Behavior

The demo loads two vectors, starts the accelerator, polls the status register until the device is done, and prints the result.
