# Highspeed IO Server

Nachbau eines Highspeed I/O Server aus dem Studium

## Aufbau

UDP & TCP protocols
-  sockets 
Thread-Manager
Internal Memory Sharing
Monitoring
- Flamegraphs
- latency
- throughput
- % Auslastung

## Workflowprozess

Wartet auf neue Verbindungen - so viele max wie möglich
Nimmt so viele Nachrichten entgegen wie möglich
Verarbeitet diese und sendet dann Rückmeldung
- schreibt es
- ließt es

## Highspeed

Shared Memory 
Spezielle Sockets für wenig Overhead und Kontextwechsel
extra Buffer und Caches für die Nachrichten und I/O Optimierung
geringe Stackgröße aka C++ und C
Producer/Consumer Pattern -> Lockless Queue

# Projektverlauf

# Stufe 1 – Server Setup & Request Handling
UDP Connection Handler (done)
Request Parser (trenne Netzwerk von Logik)
Response Logic / Business Logic
Response Sender
Logging erweitern:
Request-Timestamps
Response-Latenz
KPI: Request Count, einfache Latenz

# Stufe 2 – Versionierung / Traffic Splitting
Simuliere mehrere Server-Versionen (v1, v2, optional v3)
Entry-Server entscheidet, welche Version bedient:
Round-Robin oder Prozentuale Verteilung
Logging pro Version:
Anzahl Requests
Latenz pro Version
KPI: Traffic-Verteilung sichtbar machen
Optional: Canary Releases simulieren (z.B. v2 nur 20% Traffic)

# Stufe 3 – Load Balancer / Multi-Node Awareness
Entry-Server verteilt Requests auf mehrere Backend-Knoten
Load Balancing Algorithmus:
Round-Robin oder Random
Optional: Gewichtung nach Server-Performance
Logging / KPIs pro Backend-Knoten:
Anzahl Requests
Latenz
Health Checks für Backend-Knoten:
Node online/offline Status
Reaktion auf Node-Ausfall

# Stufe 4 – Advanced Metrics & Profiling
KPI Logging erweitern:
Latenz pro Request
Durchsatz (Requests/sec)
Paketverlust
Flame Graph / Stack Analysis für Request Handling
CPU / Memory Monitoring für Server
CPU Spike Detection:
Alerts bei hoher Last
Logging von Spitzenzeiten
Health Checks aktiv, evtl. automatische Traffic-Umschichtung bei Ausfall / CPU-Spike

# Stufe 5 – Performance / Low-Latency Optimierungen
Non-blocking Sockets (UDP)
Non-blocking Threads / Event Loops
Zero-copy Datenhandling (wenn möglich)
Optimierungen für minimalen Speicherverbrauch
Fokus: High-Throughput, Low-Latency
Logging weiterhin aktiv für KPIs
Health Checks + CPU Spike Detection weiter laufen lassen

# Stufe 6 – Optional / Erweiterungen
Optional Security Layer:
DTLS (UDP-Encryption)
Basic Auth / Token Checks
Testing / Simulation:
Lasttests
Packet Loss Simulation
Version-Split Validierung
Optional Dashboard / Anzeige von KPIs in Echtzeit

# Separate Prozesse
Python bleibt „Controller“ / Entry-Server
C-Programme laufen als separate Prozesse für Low-Latency-Handling
Kommunikation via:
UDP / TCP zwischen Prozessen
Shared Memory
Vorteil: klare Trennung, leichter zu testen


Stufe 1-3: Alles in Python → Prototyp + Logging + Traffic Split Simulation
Stufe 4:
Performance-kritische Module nach und nach in C oder Cython
Python ruft diese Module auf, übernimmt Logging, KPI, Health Checks
Vorteil: du musst nicht alles auf einmal in C neu schreiben
Optional: Später können einzelne Module als eigenständige Low-Latency Services laufen (Microservice-Ansatz)