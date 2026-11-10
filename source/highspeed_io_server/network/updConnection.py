import socket


class myUDP:
    def __init__(self, IP="127.0.0.1", PORT=5005):
        self.UDP_IP = IP
        self.UDP_PORT = PORT
        self.sock = None

    def create_socket(self):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.sock.bind((self.UDP_IP, self.UDP_PORT))
        self.sock.settimeout(1.0)

    def receiveData(self, buf_size=1024):
        try:
            data, address = self.sock.recvfrom(buf_size)
            return data, address
        except socket.timeout:
            return None, None
        except ConnectionResetError:
            return None, None
        except OSError:
            return None, None

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

    @staticmethod
    def getStandartConnection():
        return "127.0.0.1", 5005