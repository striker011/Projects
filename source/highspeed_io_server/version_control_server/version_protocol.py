from highspeed_io_server.misc.debug import Debug

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
    def _unwrap(field):
        # nur die äußeren <> entfernen, Inhalt bleibt unverändert
        if field.startswith("<") and field.endswith(">"):
            return field[1:-1]
        return field

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

            clientIP = version_protocol._unwrap(parts[0])
            clientPORT = int(version_protocol._unwrap(parts[1]))
            clientPayload = version_protocol._unwrap(parts[2])

            return clientIP, clientPORT, clientPayload
        except Exception as e:
            print("Fehler beim Decodieren des DataPackets:", e)
            return None, None, None
