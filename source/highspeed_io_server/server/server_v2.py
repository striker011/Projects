import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from highspeed_io_server.server.initServer import init_server
from highspeed_io_server.server.storage import Storage
from highspeed_io_server.server.packet_handler import packet_handler
from highspeed_io_server.server.register_with_version_control import version_control_handler
from highspeed_io_server.version_control_server.version_protocol import version_protocol


class backend_server(init_server):
    def __init__(self, ip="127.0.0.1", port=None):
        super().__init__(ip, port)
        self.storage = Storage()

        self.register_with_version_control()

    # ----------------------------
    # 📡 REGISTRATION
    # ----------------------------
    def register_with_version_control(self):
        version_control_handler.register_with_version_control(
            self.udp, self.ip, self.port, self.control_ip, self.control_port
        )

    def deregister(self):
        version_control_handler.deregister(
            self.udp, self.ip, self.port, self.control_ip, self.control_port
        )

    # ----------------------------
    # 🔁 MAIN LOOP
    # ----------------------------
    def start(self):
        print("[SERVER] Listening...")

        try:
            while True:
                data, _ = self.udp.receiveData()
                if data is None:
                    continue

                # version_control sendet <clientIP>|<clientPort>|<payload>
                clientIP, clientPORT, io_payload = version_protocol.decode_DataPacket(data)
                if clientIP is None:
                    continue

                response = packet_handler.handle_packet(io_payload, self.storage, (clientIP, clientPORT))
                if response:
                    self.udp.sendData(response, clientIP, clientPORT)

        finally:
            # 🧹 cleanup on exit/crash
            self.deregister()


# ----------------------------
# ▶️ MAIN
# ----------------------------
def main():
    print("Enter port")
    port = input()
    port = int(port)
    #port = int(os.environ.get("SERVER_PORT", "6000"))
    if port == 5005:
        print("[WARN] Port 5005 is reserved for version_control; using 6000 instead.")
        port = 6000
    server = backend_server("127.0.0.1", port)
    server.start()


if __name__ == "__main__":
    main()