from datetime import datetime

class ioPacket:

    SEP = "\x1f"  # Unit Separator (sehr sicher)

    @staticmethod
    def encode_data(operation, data):
        timestamp = datetime.now().isoformat()
        return f"{operation}{ioPacket.SEP}{data}{ioPacket.SEP}{timestamp}"

    @staticmethod
    def decode_data(packet):
        try:
            if isinstance(packet, bytes):
                packet = packet.decode()

            parts = packet.split(ioPacket.SEP)

            if len(parts) != 3:
                raise ValueError(f"Invalid packet format: {parts}")

            operation, data, timestamp = parts

            return operation, data, timestamp

        except Exception as e:
            print("Fehler beim Dekodieren:", e)
            return None, None, None

    @staticmethod
    def operation_types():
        return {
            0: "Write",
            1: "Read",
            2: "Info"
        }