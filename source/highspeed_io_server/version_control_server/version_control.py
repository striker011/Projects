import threading
from highspeed_io_server.network.updConnection import myUDP
from highspeed_io_server.version_control_server.version_protocol import version_protocol
from highspeed_io_server.version_control_server.version_packet import version_packet
from highspeed_io_server.version_control_server.load_balancer import load_balancer

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

        self.loadBalancer = load_balancer(load_balancer.STRATEGY_ROUND_ROBIN)  # Initialize the load balancer

    def register_server(self,serverIP,serverPORT):
            packet = version_packet(serverIP,serverPORT)
            self.serverList.append(packet)
            self.loadBalancer.add_server(serverIP, serverPORT)
            print(f"Registered server: {serverIP}:{serverPORT}")
    
    def deregister_server(self,serverIP,serverPORT):
        for packet in self.serverList:
            if (packet.serverIP == serverIP and packet.serverPORT == serverPORT):
                self.serverList.remove(packet)
                self.loadBalancer.remove_server(serverIP, serverPORT)
                print(f"Deregistered server: {serverIP}:{serverPORT}")
                break

    def list_servers(self):
        for packet in self.serverList:
            print(packet.getInfo())
    
    def listen_and_reroute(self):
        while self.loopBreak:
            data, addr = self.myUDPSocket.receiveData()
            if data is None or addr is None:
                continue

            if len(self.serverList) == 0:
                print("No servers available")
                continue

            server = self.loadBalancer.get_next_server()
            if server is None:
                print("No servers available in load balancer")
                continue

            newestServerPacket = server
            newestServerIP = newestServerPacket.getIP()
            newestServerPORT = newestServerPacket.getPORT()
            clientIP, clientPORT = addr
            payload = data.decode()

            packet = version_protocol.build_DataPacket(
                clientIP,
                clientPORT,
                payload
            )

            print(f"Forwarding to {newestServerIP}:{newestServerPORT}")
            self.myUDPSocket.sock.sendto(
                packet.encode(),
                (newestServerIP, newestServerPORT)
            )

    def listen_for_server_registration(self):
        while self.loopBreak:
            data, addr = self.myUDPSocketRegistration.receiveData()
            if data is None or addr is None:
                continue

            try:
                msg = data.decode()
            except Exception:
                continue

            # sehr simples Protokoll
            # Beispiel: REGISTER<127.0.0.1><6000>
            if msg.startswith("REGISTER"):
                try:
                    parts = msg.split("<")
                    ip = parts[1].replace(">", "")
                    port = int(parts[2].replace(">", ""))

                    self.register_server(ip, port)

                except Exception:
                    print("Invalid REGISTER packet")

            elif msg.startswith("DEREGISTER"):
                try:
                    parts = msg.split("<")
                    ip = parts[1].replace(">", "")
                    port = int(parts[2].replace(">", ""))

                    self.deregister_server(ip, port)

                except Exception:
                    print("Invalid DEREGISTER packet")
        

    def start(self):
        t1 = threading.Thread(target=self.listen_and_reroute)
        t2 = threading.Thread(target=self.listen_for_server_registration)

        t1.start()
        t2.start()

        t1.join()
        t2.join()