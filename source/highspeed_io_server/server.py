from updConnection import myUDP
from ioProtocol import ioPacket

storage = []

def read_data(index):
    try:
        index = int(index)
        return storage.pop(index)
    except:
        return "Read Error"


def write_data(data):
    storage.append(data)

def request_parser(raw_data,addr):
    # UDP → bytes zu string
    data_str = raw_data.decode()

    operation, data = ioPacket.decode_data(data_str)

    if operation == "0":  # Write
        write_data(data)
        return "OK"

    elif operation == "1":  # Read
        value = read_data(data)
        return value

    elif operation =="2":
        operation, data = ioPacket.decode_data(raw_data.decode())
        print(f"Received {data} from client {addr}")

    else:
        print("Error: Unknown operation")
        return "ERROR"



def main():
    udp = myUDP("127.0.0.1",5005)

    udp.create_socket()
    print("Server läuft auf 127.0.0.1:5005 ...")
    while(1):
        data, addr = udp.receiveData()
        response = request_parser(data,addr)
        if response is not None:
            udp.sock.sendto(str(response).encode(), addr) 
    
    udp.close_socket()

if __name__ == "__main__":
    main()