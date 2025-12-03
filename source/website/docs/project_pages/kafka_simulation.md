# Kafka Simulation

## Basiered auf meiner Abschlussarbeit

### Übersicht 

>Alter Aufbau

:::mermaid
graph TD;
    IoT-Geräte-->EMQP
    EMQP-->ML-Server
    EMQP-->Datenbank
    EMQP-->FileServer
    ML-Server-->Schnelle_Daten
    Datenbank-->Mittel_schnelle_Daten
    FileServer-->Langsame_Daten
:::

>Neuer Aufbau

:::mermaid
graph TD;
    IoT-Geräte-->Kafka
    Kafka-->Filehosting
    Kafka-->Schnelle_Daten
    Kafka-->Mittel_schnelle_Daten
    Filehosting-->Langsame_Daten
:::

