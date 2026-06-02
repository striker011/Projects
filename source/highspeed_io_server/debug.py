class Debug:
    @staticmethod
    def log(value,label = "var"):
        print(f"[DEBUG] {label}: {repr(value)}")