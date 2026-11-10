import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from highspeed_io_server.network.updConnection import myUDP
from highspeed_io_server.protocol.ioProtocol import ioPacket

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

    # if this is missing, the server crashes
    #if the server doesn't send a response, this will block indefinitely
    data, address = udp.receiveData()
    print("Received data: {} from {}".format(data, address))


    udp.close_socket()

if __name__ == "__main__":
    main()