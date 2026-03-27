# App API-Anbindungen

Dieses Dokument beschreibt die konkrete technische Integration verschiedener APIs in die Smart Village App.

## 1. Smart-Village-Backend API

Die App kommuniziert über HTTP(S) mit dem zentralen Smart-Village-Backend. Für die plattformübergreifende Implementierung in Kotlin Multiplatform (KMP) wird der **Ktor Client** als HTTP-Client verwendet. Dieser ermöglicht es, die Netzwerkanfragen asynchron in Coroutines abzuwickeln und die JSON-Antworten mithilfe von `kotlinx.serialization` direkt in typsichere Kotlin-Datenklassen zu parsen.

### Verwendete Endpunkte

- **`GET /api/villages`**
  - **Zweck:** Wird typischerweise beim ersten App-Start aufgerufen, um alle im System registrierten Dörfer abzurufen.
  - **Verwendung:** Die App präsentiert dem Nutzer eine Liste der verfügbaren Dörfer. Der Nutzer wählt sein Dorf aus (z.B. "Gündelwangen"), woraufhin die App dessen spezifische ID speichert, um weitere Anfragen zu personalisieren.

- **`GET /api/initial-data`**
  - **Zweck:** Abruf der initialen Sensordaten, Wetterinformationen und weiterer relevanter Kontextinformationen für das ausgewählte Dorf.
  - **Verwendung:** Dieser Endpunkt bündelt mehrere Informationen, sodass die App beim Start nicht viele verschiedene Requests absenden muss, sondern mit einem Ladezyklus alle essenziellen Dashboard-Daten erhält.

### Temporäre Lösung für MQTT (Daten-Fetch)

Ursprünglich war architektonisch vorgesehen, dass die App Echtzeit-Sensordaten direkt vom Server über das MQTT-Protokoll abonniert.
**Problem:** Der Standard-MQTT-Port `1883` wurde für unseren Server im Netzwerk der DHBW nicht freigegeben. Ein direkter MQTT-Zugriff (Subscribe/Publish) aus der App heraus auf den Broker ist dadurch in der aktuellen Infrastruktur nicht möglich.
**Workaround:** Als temporäre Lösung wurde ein klassischer HTTP-Polling-Mechanismus (Daten-Fetch) implementiert. Die App ruft periodisch oder bei Aktualisierung durch den Nutzer den Endpunkt `/api/initial-data` auf. Das Backend selbst konsumiert die MQTT-Nachrichten lokal, speichert den letzten Zustand (bzw. schreibt ihn in die Datenbank) und stellt ihn dann über diesen HTTP-Endpunkt an die App-Clients zur Verfügung.

## 2. Timetables-API der Deutschen Bahn (DB)

Um den Bürgern lokale Mobilitätsdaten in Echtzeit zur Verfügung zu stellen, bindet die App direkt die Timetables-API der Deutschen Bahn ein.

### Technische Verwendung der Endpunkte

Die Integration der DB-Schnittstelle erfordert üblicherweise eine zweistufige Abfrage, um von einem Haltestellennamen zu den finalen Abfahrtszeiten zu gelangen:

- **1. Haltestellensuche (Location API / Station Selection)**
  - **Zweck:** Auflösung eines Dorf- oder Haltestellennamens in eine eindeutige Stations-ID (z. B. EVA-Nummer).
  - **Verwendung:** Beim Konfigurieren des ÖPNV-Widgets oder im Hintergrund sucht die App nach den zugehörigen Haltestellen des Dorfes. Die API liefert eine Liste möglicher Stationen mitsamt Koordinaten und ID zurück.
  
- **2. Abfahrtsmonitor (Departure Board API)**
  - **Zweck:** Abruf aktueller Abfahrten für eine bestimmte Stations-ID.
  - **Verwendung:** Die App fragt mit der zuvor ermittelten Stations-ID die nächsten abfahrenden Verkehrsmittel (Busse, Regionalbahnen etc.) ab. Die JSON-Antwort enthält neben den geplanten Abfahrtszeiten auch Echtzeit-Updates (Verspätungen, Zugausfälle) sowie Informationen zur Richtung/Endstation. Diese Daten werden geparst und direkt in der App gerendert, wodurch ein eigenes aufwändiges Fahrplan-Backend entfällt.
