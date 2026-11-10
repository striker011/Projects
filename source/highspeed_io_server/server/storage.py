
from datetime import datetime


class Storage:

    def __init__(self):
        self.storage = []
        self.log = []
    
    # storage = []
    # log= []

    def create_log_info(self, operation, addr, sent_timestamp):
        current_time = datetime.now()
        latency = current_time - datetime.fromisoformat(sent_timestamp)
        log_msg = f"<{current_time}><{addr}><{operation}><latency<{latency}>>"
        return log_msg

    def read_log(self, index):
        try:
            index = int(index)
            return self.log.pop(index)
        except:
            return "Read Error"

    def peek_log(self, index):
        try:
            index = int(index)
            return self.log[index]
        except:
            return "Read Error"

    def write_log(self, data):
        self.log.append(data)

    def write(self, data):
        self.storage.append(data)
        return "WRITE_OK"

    def read(self, index):
        try:
            return self.storage[int(index)]
        except:
            return "READ_ERROR"

    def read_data(self, index):
        try:
            index = int(index)
            return self.storage.pop(index)
        except:
            return "Read Error"

    def write_data(self, data):
        self.storage.append(data)