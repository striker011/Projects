class version_packet:
    def __init__(self,ip,port):
        self.serverIP = ip
        self.serverPORT = port
    
    def getInfo(self):
        return self.serverIP, self.serverPORT