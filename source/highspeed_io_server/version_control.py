from updConnection import myUDP
import threading

class version_protocol:
    @staticmethod
    def build_RegisterPacket(ip,port):
        return f"REGISTER<{ip}><{int(port)}>"
    
    @staticmethod
    def build_DeRegisterPacket(ip,port):
        return f"DEREGISTER<{ip}><{int(port)}>"


class version_packet:
    def __init__(self,ip,port):
        self.serverIP = ip
        self.serverPORT = port
    
    def getInfo(self):
        return self.serverIP, self.serverPORT

class versioner: 
    def __init__(self,ip,port):
        self.myIP = ip
        self.myPort = port
        self.myUDPSocket = myUDP("127.0.0.1",5005)
        self.myUDPSocketRegistration = myUDP("127.0.0.1",55)

        self.myUDPSocket.create_socket()
        self.myUDPSocketRegistration.create_socket()

        self.serverList = []
        self.serverThreadPool = []
        self.loopBreak = True

    def register_server(self,serverIP,serverPORT):
            packet = version_packet(serverIP,serverPORT)
            self.serverList.append(packet)
            print(f"Registered server: {serverIP}:{serverPORT}")
    
    def deregister_server(self,serverIP,serverPORT):
        for packet in self.serverList:
            if (packet.serverIP == serverIP and packet.serverPORT == serverPORT):
                self.serverList.remove(packet)
                print(f"Deregistered server: {serverIP}:{serverPORT}")
                break

    def list_servers(self):
        for packet in self.serverList:
            print(packet.getInfo())
    
    def listen_and_reroute(self):
        while self.loopBreak:
            data, addr = self.myUDPSocket.receiveData()
            if len(self.serverList) == 0:
                print("No servers available")
                continue
            newestServerPacket = self.serverList[-1]
            print(f"Forwarding to {newnewestServerPacket.serverIP}:{newestServerPacket.serverPORT}")
            self.myUDPSocketUDP.sock.sendto(data,(newestServerPacket.serverIP,newestServerPacket.serverPORT))
        

    def listen_for_server_registration(self):
        while self.loopBreak:
            data,addr = self.myUDPSocketRegistration.receiveData()
            msg = data.decode()
            
            # sehr simples Protokoll
            # Beispiel: REGISTER<127.0.0.1><6000>
            if msg.startswith("REGISTER"):
                try:
                    parts = msg.split("<")
                    ip = parts[1].replace(">", "")
                    port = int(parts[2].replace(">", ""))

                    self.register_server(ip, port)

                except:
                    print("Invalid REGISTER packet")

            elif msg.startswith("DEREGISTER"):
                try:
                    parts = msg.split("<")
                    ip = parts[1].replace(">", "")
                    port = int(parts[2].replace(">", ""))

                    self.deregister_server(ip, port)

                except:
                    print("Invalid DEREGISTER packet")
        

    def start(self):
        t1 = threading.Thread(target=self.listen_and_reroute)
        t2 = threading.Thread(target=self.listen_for_server_registration)

        t1.start()
        t2.start()

        t1.join()
        t2.join()


def main():
    v = versioner("127.0.0.1", 5005)

    print("Versioner läuft...")
    print("Port 5005 = Data")
    print("Port 55 = Registration")

    v.start()


if __name__ == "__main__":
    main()
