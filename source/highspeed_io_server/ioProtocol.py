class ioPacket:

    @staticmethod
    def encode_data(operation, data):
        return f"{operation}<{data}>"

    @staticmethod
    def decode_data(packet):
        try:
            operation = packet[0]

            start = packet.find("<") + 1
            end = packet.find(">")

            data = packet[start:end]

            return operation, data

        except Exception as e:
            print("Fehler beim Dekodieren:", e)
            return None, None

    @staticmethod
    def operation_types():
        print("0 - Write; 1 - Read, 2 - Info")