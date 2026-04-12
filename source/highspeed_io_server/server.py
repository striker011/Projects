from updConnection import myUDP

def main():
    udp = myUDP("127.0.0.1",5005)

    udp.create_socket()

    while(1):
        data, addr = udp.receiveData()
        print(f"Recieved {data} from {addr}")
    
    udp.close_socket()

if __name__ == "__main__":
    main()