from updConnection import myUDP
from ioProtocol import ioPacket

def main():
    print("Enter port")

    port = input()
    port = int(port)
    ip = "127.0.0.1"

    udp = myUDP(ip,port)

    udp.create_socket()

    operation = 2
    data="Hello World"

    msg = ioPacket.encode_data(operation,data)

    udp.sendData(msg,ip,5005)

    udp.close_socket()

if __name__ == "__main__":
    main()