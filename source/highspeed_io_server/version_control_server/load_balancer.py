class server_packet:
    def __init__(self, server_ip, server_port):
        self.serverIP = server_ip
        self.serverPORT = server_port

    def getIP(self):
        return self.serverIP

    def getPORT(self):
        return self.serverPORT

class load_balancer:

    STRATEGY_ROUND_ROBIN = "round_robin"
    LIST_OF_STRATEGIES = [STRATEGY_ROUND_ROBIN]
    

    def __init__(self, strategy=STRATEGY_ROUND_ROBIN):
        if strategy not in self.LIST_OF_STRATEGIES:
            raise ValueError(f"Invalid strategy: {strategy}")
        self.strategy = strategy
        self.strategy_instance = None

        self.initial_server = None

        if self.strategy == self.STRATEGY_ROUND_ROBIN:
            self.strategy_instance = self.round_robin(self.initial_server)

    def add_server(self, server_ip, server_port):
        if self.strategy_instance:
            self.strategy_instance.add_server(server_ip, server_port)
        else:
            raise ValueError("No strategy instance available")

    def remove_server(self, server_ip, server_port):
        if self.strategy_instance:
            self.strategy_instance.remove_server(server_ip, server_port)
        else:
            raise ValueError("No strategy instance available")

    def get_next_server(self):
        if self.strategy_instance:
            return self.strategy_instance.get_next_server()
        raise ValueError("No strategy instance available")

    class round_robin:
        def __init__(self,server):
            self.index = 0
            self.servers = [server] if server else []

        def add_server(self, server_ip, server_port):
            self.servers.append(server_packet(server_ip, server_port))

        def remove_server(self, server_ip, server_port):
            self.servers = [s for s in self.servers if s.serverIP != server_ip or s.serverPORT != server_port]


        def get_next_server(self):
            if not self.servers:
                return None
            server = self.servers.pop(0)
            self.servers.append(server)
            return server
