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

## Aufgaben

### 1. Zeitplan erstellen
Vorläufigen Zeitplan für die bisherige Umsetzungsdauer aller Aufgaben.

### 2. Anforderungen erarbeiten
Welche Bediungen existieren momentan und wie müssen wir uns daran anpassen. Was muss alles beachtet werden.  Was sind die Erfolgskriterien, nach welchen das Projekt abgeschlossen werden kann.

### 3. Anforderungsheft erstellen
Alle Anforderungen in einem Anforderungsdokument zusammenfassen.

### 4. Erfolgskriterienheft erstellen
Alle Erfolgskriterien in einem Erfolgskriteriendokument zusammenfassen.

### 5. Simulation erstellen
Herausarbeiten, in welcher Weise eine Simulation das Projekt unterstützen kann. Simulation erstellen und Ergebnisse analysieren und einordnen.

### 6. Projekt beginnen
Ergebnisse zusammentragen, auswerten und einordnen.
Erstellung eines Papers zur Weitergabe.

### 7. Projekt beenden
Paper ist fertig.
Erarbeitung der Zeitunterschiede von geplant und reell plus Analyse mit eigens Festhaltung im Zeitplanungsdokument.

Abschließene Erkenntnisse zur Projektarbeit erarbeiten und in einem Projektarbeitabschlussdokument festhalen.

Anforderungsdokument, Erfolgskriteriendokument, Paper, Zeitplanungsdokument und Projektarbeitabschlussdokument zusammentragen und in einem finalen Kafka-Machbarkeitsstudiendokument festhalten.

## Projekt

### Zeitplan

### Anforderungen

* Sicherheit
* Throughput
* Latency 
* Versionierung
* Kafka-Konfiguration
* Kosten

### Erfolgskriterien

* Machbarkeit
* Wettbewerbsvorteil

### Simulation
* Kafka-Konfiguration und Datenraten messen

## Benötigte Dokumente

### Interne Anforderungen
### Kafka Konfiguration
### Vergleichbare Studien
### Methodikablauf
### Simulationserstellung
### Paper schreiben

## Aufgabenabarbeitungsliste