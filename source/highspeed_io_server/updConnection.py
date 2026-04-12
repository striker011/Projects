import socket;
class myUDP:
    def __init__(self, IP="127.0.0.1", PORT=5005):
        self.UDP_IP = IP
        self.UDP_PORT = PORT
        self.sock = None

    def create_socket(self):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.bind((self.UDP_IP, self.UDP_PORT))

    def receiveData(self, buf_size=1024):
        data, address = self.sock.recvfrom(buf_size)
        return data, address

    def sendData(self, msg, ip, port):
        try:
            self.sock.sendto(msg.encode(), (ip, port))
        except Exception as e:
            print("Error when sending data:", e)

    def close_socket(self):
        try:
            self.sock.close()
        except Exception as e:
            print("Error closing socket:", e)