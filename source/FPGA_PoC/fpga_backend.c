#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#define FPGA_API __declspec(dllexport)
#else
#define FPGA_API
#endif

enum {
    FPGA_REG_CTRL = 0,
    FPGA_REG_STATUS = 1,
    FPGA_REG_LEN = 2,
    FPGA_REG_OP = 3,
    FPGA_REG_LAST_SUM = 4,
    FPGA_REG_COUNT = 8
};

enum {
    FPGA_CTRL_START = 1u << 0,
    FPGA_STATUS_IDLE = 0u,
    FPGA_STATUS_BUSY = 1u << 0,
    FPGA_STATUS_DONE = 1u << 1,
    FPGA_STATUS_ERROR = 1u << 2,
    FPGA_OP_VECTOR_ADD = 1u,
    FPGA_OP_DOT_PRODUCT = 2u
};

typedef struct FpgaDevice {
    uint32_t registers[FPGA_REG_COUNT];
    uint32_t *input_a;
    uint32_t *input_b;
    uint32_t *output;
    size_t capacity;
    size_t length;
} FpgaDevice;

static void fpga_clear_status(FpgaDevice *device) {
    device->registers[FPGA_REG_STATUS] = FPGA_STATUS_IDLE;
}

static int fpga_prepare_buffers(FpgaDevice *device, size_t length) {
    if (length == 0 || length > device->capacity) {
        device->registers[FPGA_REG_STATUS] = FPGA_STATUS_ERROR;
        return -1;
    }
    return 0;
}

FPGA_API FpgaDevice *fpga_create(size_t capacity) {
    FpgaDevice *device = (FpgaDevice *)calloc(1, sizeof(FpgaDevice));
    if (!device) {
        return NULL;
    }

    device->input_a = (uint32_t *)calloc(capacity, sizeof(uint32_t));
    device->input_b = (uint32_t *)calloc(capacity, sizeof(uint32_t));
    device->output = (uint32_t *)calloc(capacity, sizeof(uint32_t));
    if (!device->input_a || !device->input_b || !device->output) {
        free(device->input_a);
        free(device->input_b);
        free(device->output);
        free(device);
        return NULL;
    }

    device->capacity = capacity;
    device->length = 0;
    device->registers[FPGA_REG_STATUS] = FPGA_STATUS_IDLE;
    return device;
}

FPGA_API void fpga_destroy(FpgaDevice *device) {
    if (!device) {
        return;
    }
    free(device->input_a);
    free(device->input_b);
    free(device->output);
    free(device);
}

FPGA_API int fpga_load_input_a(FpgaDevice *device, const uint32_t *data, size_t length) {
    if (!device || !data || fpga_prepare_buffers(device, length) != 0) {
        return -1;
    }
    memcpy(device->input_a, data, length * sizeof(uint32_t));
    device->length = length;
    device->registers[FPGA_REG_LEN] = (uint32_t)length;
    return 0;
}

FPGA_API int fpga_load_input_b(FpgaDevice *device, const uint32_t *data, size_t length) {
    if (!device || !data || fpga_prepare_buffers(device, length) != 0) {
        return -1;
    }
    memcpy(device->input_b, data, length * sizeof(uint32_t));
    device->length = length;
    device->registers[FPGA_REG_LEN] = (uint32_t)length;
    return 0;
}

FPGA_API int fpga_start(FpgaDevice *device, uint32_t op_code) {
    size_t index;
    uint64_t sum = 0;

    if (!device || device->length == 0) {
        return -1;
    }

    device->registers[FPGA_REG_CTRL] = FPGA_CTRL_START;
    device->registers[FPGA_REG_STATUS] = FPGA_STATUS_BUSY;
    device->registers[FPGA_REG_OP] = op_code;

    switch (op_code) {
    case FPGA_OP_VECTOR_ADD:
        for (index = 0; index < device->length; ++index) {
            device->output[index] = device->input_a[index] + device->input_b[index];
            sum += device->output[index];
        }
        break;
    case FPGA_OP_DOT_PRODUCT:
        for (index = 0; index < device->length; ++index) {
            sum += (uint64_t)device->input_a[index] * (uint64_t)device->input_b[index];
        }
        break;
    default:
        device->registers[FPGA_REG_STATUS] = FPGA_STATUS_ERROR;
        return -2;
    }

    device->registers[FPGA_REG_LAST_SUM] = (uint32_t)(sum & 0xffffffffu);
    device->registers[FPGA_REG_STATUS] = FPGA_STATUS_DONE;
    device->registers[FPGA_REG_CTRL] = 0;
    return 0;
}

FPGA_API int fpga_read_output(FpgaDevice *device, uint32_t *buffer, size_t length) {
    if (!device || !buffer || length < device->length) {
        return -1;
    }
    memcpy(buffer, device->output, device->length * sizeof(uint32_t));
    return 0;
}

FPGA_API uint32_t fpga_read_register(FpgaDevice *device, uint32_t reg_index) {
    if (!device || reg_index >= FPGA_REG_COUNT) {
        return 0;
    }
    return device->registers[reg_index];
}

FPGA_API void fpga_write_register(FpgaDevice *device, uint32_t reg_index, uint32_t value) {
    if (!device || reg_index >= FPGA_REG_COUNT) {
        return;
    }
    device->registers[reg_index] = value;
    if (reg_index == FPGA_REG_STATUS && value == FPGA_STATUS_IDLE) {
        device->registers[FPGA_REG_CTRL] = 0;
    }
}

FPGA_API void fpga_reset(FpgaDevice *device) {
    if (!device) {
        return;
    }
    memset(device->registers, 0, sizeof(device->registers));
    device->length = 0;
    fpga_clear_status(device);
}
