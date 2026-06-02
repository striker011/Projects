from updConnection import myUDP
import threading
from debug import Debug

class version_protocol:
    @staticmethod
    def build_RegisterPacket(ip,port):
        return f"REGISTER<{ip}><{int(port)}>"
    
    @staticmethod
    def build_DeRegisterPacket(ip,port):
        return f"DEREGISTER<{ip}><{int(port)}>"

    @staticmethod
    def build_DataPacket(clientIP,clientPORT,clientPayload):
        return f"<{clientIP}>|<{clientPORT}>|<{clientPayload}>"

    @staticmethod
    def decode_DataPacket(packet, debug=False):
        try:
            if isinstance(packet, bytes):
                packet = packet.decode() 

            if debug:
                Debug.log("packet",packet)
                Debug.log(type(packet), "packet_type")
            
            parts = packet.split("|", 2)
            if debug:
                Debug.log("parts",parts)
                Debug.log(type(parts), "parts_type")

            clientIP = parts[0].replace("<", "").replace(">", "")
            clientPORT = int(parts[1].replace("<", "").replace(">", ""))
            clientPayload = parts[2].replace("<", "").replace(">", "")

            return clientIP, clientPORT, clientPayload
        except Exception as e:
            print("Fehler beim Decodieren des DataPackets:", e)
            return None, None, None



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

            clientIP, clientPORT = addr

            payload = data.decode()

            packet = version_protocol.build_DataPacket(
                clientIP,
                clientPORT,
                payload
            )

            print(f"Forwarding to {newestServerPacket.serverIP}:{newestServerPacket.serverPORT}")
            self.myUDPSocket.sock.sendto(
                packet.encode(),
                (newestServerPacket.serverIP, newestServerPacket.serverPORT)
            )

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
