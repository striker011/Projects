from updConnection import myUDP
from ioProtocol import ioPacket
from datetime import datetime
from datetime import timedelta

storage = []

log= []

def read_log(index):
    try:
        index = int(index)
        return log.pop(index)
    except:
        return "Read Error"

def peek_log(index):
    try:
        index = int(index)
        return log[index]
    except:
        return "Read Error"

def write_log(data):
    log.append(data)

def create_log_info(raw_data, addr):
    current_time = datetime.now()
        # bytes → string (falls nötig)
    if isinstance(raw_data, bytes):
        raw_data = raw_data.decode()

    operation, payload, timestamp = ioPacket.decode_data(raw_data)
    timestamp_dt = datetime.fromisoformat(timestamp)
    log_msg = f"<{current_time}><{addr}><{operation}><latency<{current_time - timestamp_dt}>>"
    return log_msg

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

    operation, data, timestamp = ioPacket.decode_data(data_str)

    if operation == "0":  # Write
        write_data(data)
        return "OK"

    elif operation == "1":  # Read
        value = read_data(data)
        return value

    elif operation =="2":
        print(f"Received {data} from client {addr}")

    else:
        print("Error: Unknown operation")
        return "ERROR"



def main():
    udp = myUDP("127.0.0.1",5005)

    udp.create_socket()
    print("Server läuft auf 127.0.0.1:5005 ...")
    current_time = datetime.now()
    
    while(1):
        data, addr = udp.receiveData()
        write_log(create_log_info(data,addr))
        response = request_parser(data,addr)
        if response is not None:
            udp.sock.sendto(str(response).encode(), addr) 
        time = datetime.now()
        if time > (current_time + timedelta(seconds=5)):
            value = peek_log(-1)
            if value != "Read Error":
                print(value)
            current_time = datetime.now()
    
    udp.close_socket()

if __name__ == "__main__":
    main()