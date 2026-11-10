import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from highspeed_io_server.version_control_server.version_control import versioner


def main():
    v = versioner("127.0.0.1", 5005)

    print("Versioner läuft...")
    print("Port 5005 = Data")
    print("Port 55 = Registration")

    v.start()


if __name__ == "__main__":
    main()
