import os
import sys
from datetime import datetime

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from highspeed_io_server.protocol.ioProtocol import ioPacket


class packet_handler:
    
    @staticmethod
    def handle_packet(packet, storage, addr=None):
        try:
            operation, payload, timestamp = ioPacket.decode_data(packet)
            if operation is None:
                return "ERROR|INVALID_PACKET"

            latency = datetime.now() - datetime.fromisoformat(timestamp)

            if operation == "0":
                return f"{storage.write(payload)}|latency={latency}"

            elif operation == "1":
                return f"{storage.read(payload)}|latency={latency}"

            elif operation == "2":
                print(f"[INFO] {payload} from {addr}")
                return f"ACK|latency={latency}"

            return "ERROR|UNKNOWN_OPERATION"

        except Exception as e:
            return f"ERROR|{e}"