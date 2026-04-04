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