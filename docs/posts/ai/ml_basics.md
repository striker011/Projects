# Überblick über LLM

## Worum geht es ?

Man trainiert ein Modell mit Daten, woraus es für weitere Ereignisse Vorhersagen trifft und anhand der Akkurarität das Modell anpasst.
(https://developers.google.com/machine-learning/intro-to-ml/what-is-ml?hl=de)

## Arten

 - Supervised
 - Unsupervised
 - Reinforced Learning
 - Generative KI

### Supervised

Das Modell bekommt Fragen mit den richtigen Antworten geliefert, diese Antworten wuren händisch von Menschen ausgewertet und bereit gestellt.

Man unterscheided die zwei häufigsten Anwendungsfälle:
 - - Regression 
 - - Klassifizierung

#### Regression

Voraussage eines numerischen Wertes

#### Klassifizierung

Voraussage, mit wie viel Wahrscheinlichkeit etwas zu einer Kategorie gehört


#### Konzepte
Allgemein basiert das supervised Learning auf Daten, Modell, Training, Bewertung und Inferenz.

##### Daten

Daten können in Form von Pixelwerten und Wellen für Bilder oder in Form von Zahlen und Wörter in Tabellen vorliegen.
Weiterhin unterscheidet man zwischen [Feature] (DE: Merkmal) und [Label] (DE: Antwort). Das Label ist schlussendlich die Vorhersage. Daten die beides enthalten, werden [labled-example] gennnt. 

##### Model

Das Modell ist die komplexe Sammlung von Zahlen, die die mathematischen Beziehungen zwischen Feature und Label definieren.

##### Training

Anhand von Beispielen, soll das Modell eine so genaue Vorhersage, wie nur möglich, erstellen.

### Unsupervised

Hiermit sollen aussagekräftige Muster in einem Datenset identifiziert werden. Eine sehr häufige Methode heißt Clustering, da hierbei die Daten in Cluster (DE Gruppen) angeordnet werden. Im Unterschied zu der Klassifikation werden beim Clustering, werden die Daten nicht durch die Kategorie bestimmt, viel mehr lassen sich aus der Gruppierung der Daten Rückschlüsse auf die Kategorieren bilden. Bei Wetter Daten könnten Gruppen entstehen (Schnee, Regen, Schneeregen, kein Regen), die man in die Jahreszeiten kategorisieren kann. Die Datengruppierungen (Cluster) sind unbekannt und müssen durch die Daten definiert werden und was diese bedeuten.

### Reinforced Learning

Hierbei werden Modelle mit einer Belohnung bzw. einer Strafe versehen, anhand definierter Ziele. Diese Ziele können aktives Gehen im Raum sein.

### Generative KI

Diese werden häufig anhand der Ein- und Ausgabe der Dateiformate klassifiziert.

- Text <-> Text
- - Text <-> Code
- - Text <-> Sprache

- Text <-> Graphisch
- - Text <-> Bild
- - Text <-> Video

- Bild <-> Bild
- - Bild <-> Text

Allgemein lernen diese Modelle, in dem sie Muster in Trainingsdaten erkennen und diese für die Ausgabe replizieren. Zunächst erfolgt ein unsupervised Learning, um die Daten 1:1 nachbilden zu können. Bei supervised Learning gilt es gezielt nur eine einzige Aufgabe dem Modell anzutrainieren.
