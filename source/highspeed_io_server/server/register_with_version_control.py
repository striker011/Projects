class version_control_handler:

    def init(self, udp, ip, port, version_control_ip="127.0.0.1", version_control_port=55):
        self.udp = udp
        self.ip = ip
        self.port = port
        self.control_ip = version_control_ip
        self.control_port = version_control_port

    @staticmethod
    def register_with_version_control(udp, ip, port, control_ip="127.0.0.1", control_port=55):
        msg = f"REGISTER<{ip}><{port}>"

        udp.sock.sendto(
            msg.encode(),
            (control_ip, control_port)
        )

        print("[SERVER] registered at version_control")

    @staticmethod
    def deregister(udp, ip, port, control_ip="127.0.0.1", control_port=55):
        msg = f"DEREGISTER<{ip}><{port}>"

        udp.sock.sendto(
            msg.encode(),
            (control_ip, control_port)
        )

        print("[SERVER] deregistered")