from datetime import datetime
class ioPacket:

    @staticmethod
    def encode_data(operation, data):
        return f"{operation}<{data}><{datetime.now()}>"

    @staticmethod
    def decode_data(packet):
        try:
            operation = packet[0]

            # erstes Feld (data)
            first_start = packet.find("<") + 1
            first_end = packet.find(">")

            data = packet[first_start:first_end]

            # zweites Feld (timestamp)
            second_start = packet.find("<", first_end) + 1
            second_end = packet.find(">", first_end + 1)

            timestamp = packet[second_start:second_end]

            return operation, data, timestamp

        except Exception as e:
            print("Fehler beim Dekodieren:", e)
            return None, None, None

    @staticmethod
    def operation_types():
        print("0 - Write; 1 - Read, 2 - Info")