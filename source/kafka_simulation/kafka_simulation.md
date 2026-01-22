# Kafka Simulation

## Basiert auf meiner Abschlussarbeit

### Übersicht

**Alter Aufbau**

```mermaid
graph TD;
    IoT_Geraete["IoT-Geräte"] --> EMQP
    EMQP --> ML_Server["ML-Server"]
    EMQP --> DB["Datenbank"]
    EMQP --> FileServer
    ML_Server --> Schnelle_Daten
    DB --> Mittel_schnelle_Daten
    FileServer --> Langsame_Daten
```

**Neuer Aufbau**

```mermaid
graph TD;
    IoT_Geraete["IoT-Geräte"] --> Kafka
    Kafka --> Filehosting
    Kafka --> Schnelle_Daten
    Kafka --> Mittel_schnelle_Daten
    Filehosting --> Langsame_Daten
```

---


### Anforderungen

- Sicherheit  
- Throughput  
- Latenz  
- Versionierung  
- Kafka-Konfiguration  
- Kosten  

### Erfolgskriterien

- Machbarkeit  
- Wettbewerbsvorteil  
