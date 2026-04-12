from updConnection import myUDP

def main():
    print("Enter port")

    port = input()
    port = int(port)
    ip = "127.0.0.1"

    udp = myUDP(ip,port)

    udp.create_socket()

    udp.sendData("Hallo Welt",ip,5005)

    udp.close_socket()

if __name__ == "__main__":
    main()