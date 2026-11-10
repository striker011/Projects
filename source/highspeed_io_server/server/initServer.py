import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from highspeed_io_server.network.updConnection import myUDP


class init_server:
    def __init__(self, ip="127.0.0.1", port=100, version_control_ip="127.0.0.1", version_control_port=55):
        self.ip = ip

        if port is None:
            port = int(input("Enter server port: "))

        self.port = port

        # 📡 main UDP socket
        self.udp = myUDP(ip, port)
        self.udp.create_socket()

        # 📡 version_control config
        self.control_ip = version_control_ip
        self.control_port = version_control_port  # dein registration port

        print(f"[SERVER] Running on {ip}:{port}")