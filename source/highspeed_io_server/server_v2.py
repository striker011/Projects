from updConnection import myUDP
from ioProtocol import ioPacket
from datetime import datetime


class backend_server:
    def __init__(self, ip="127.0.0.1", port=None):
        self.ip = ip

        if port is None:
            port = int(input("Enter server port: "))

        self.port = port

        # 📡 main UDP socket
        self.udp = myUDP(ip, port)
        self.udp.create_socket()

        # 📡 version_control config
        self.control_ip = "127.0.0.1"
        self.control_port = 55  # dein registration port

        self.storage = []

        print(f"[SERVER] Running on {ip}:{port}")

        # 🚀 auto register
        self.register_with_version_control()

    # ----------------------------
    # 📡 REGISTRATION
    # ----------------------------
    def register_with_version_control(self):
        msg = f"REGISTER<{self.ip}><{self.port}>"

        self.udp.sock.sendto(
            msg.encode(),
            (self.control_ip, self.control_port)
        )

        print("[SERVER] registered at version_control")

    def deregister(self):
        msg = f"DEREGISTER<{self.ip}><{self.port}>"

        self.udp.sock.sendto(
            msg.encode(),
            (self.control_ip, self.control_port)
        )

        print("[SERVER] deregistered")

    # ----------------------------
    # 📦 STORAGE
    # ----------------------------
    def write(self, data):
        self.storage.append(data)
        return "WRITE_OK"

    def read(self, index):
        try:
            return self.storage[int(index)]
        except:
            return "READ_ERROR"

    # ----------------------------
    # 📥 PACKET HANDLER
    # ----------------------------
    def handle_packet(self, raw_data, addr):
        try:
            if isinstance(raw_data, bytes):
                raw_data = raw_data.decode()

            operation, payload, timestamp = ioPacket.decode_data(raw_data)

            now = datetime.now()
            sent_time = datetime.fromisoformat(timestamp)

            latency = now - sent_time

            if operation == "0":
                return f"{self.write(payload)}|latency={latency}"

            elif operation == "1":
                return f"{self.read(payload)}|latency={latency}"

            elif operation == "2":
                print(f"[INFO] {payload} from {addr}")
                return f"ACK|latency={latency}"

            return "ERROR|UNKNOWN_OPERATION"

        except Exception as e:
            return f"ERROR|{e}"

    # ----------------------------
    # 🔁 MAIN LOOP
    # ----------------------------
    def start(self):
        print("[SERVER] Listening...")

        try:
            while True:
                data, addr = self.udp.receiveData()
                response = self.handle_packet(data, addr)

                if response:
                    self.udp.sock.sendto(response.encode(), addr)

        finally:
            # 🧹 cleanup on exit/crash
            self.deregister()


# ----------------------------
# ▶️ MAIN
# ----------------------------
def main():
    server = backend_server("127.0.0.1")
    server.start()


if __name__ == "__main__":
    main()