## Netzwerk- und Zugriffskonzept

### 1. Internes System (Admin, voller Zugriff)

- Interner Server im Verwaltungsnetz (z.B. Rathaus, Rechenzentrum).
- Zugriff nur für autorisierte Admins über VPN.
- Komponenten:
  - Backend mit Admin-Funktionen (Sensoren anlegen, Dörfer verwalten, Fehleranalyse).
  - Volle Datenbank (PostgreSQL) mit:
    - `accounts`, `villages`, `users`
    - `sensor_types`, `sensors`, `sensor_status`
    - `sensor_readings` (komplette Historie)
- Einsatzzweck:
  - Konfiguration und Betrieb der Smart-Village-Infrastruktur.
  - Ausführliche Logs, Fehlersuche, technische Auswertungen.

### 2. Externes System (Mini-Datenserver für User)

- Getrennter, kleiner „Public“-Server im Internet.
- Kein VPN für normale Nutzer notwendig.
- Enthält nur eine reduzierte Datenbasis, z.B.:
  - Aggregierte oder letzte Messwerte pro Sensor.
  - Nur öffentlich relevante Informationen (Status, einfache Kennzahlen).
- Zugriff:
  - Mobile App und öffentliche Website lesen ausschließlich von diesem Mini-Datenserver.
  - Nur lesende Endpoints (kein Admin, keine Konfiguration).

### 3. Datensynchronisation intern → extern

- Regelmäßiger Sync-Prozess (z.B. alle 1–5 Minuten).
- Ablauf (vereinfacht):
  - Internes Backend/Script liest relevante Daten aus der vollen DB.
  - Daten werden gefiltert und ggf. aggregiert (z.B. letzte Messwerte, Tagesdurchschnitte).
  - Über eine gesicherte Schnittstelle werden diese Daten an den Mini-Datenserver übertragen.
- Ergebnis:
  - Interne, sensible Struktur bleibt geschützt.
  - Der externe Server stellt nur die benötigten, nicht-kritischen Informationen für Bürger und App-User bereit.

### 4. Vorteile dieses Modells

- Admins: sicherer Vollzugriff nur über VPN auf das interne System.
- Nutzer: einfacher Zugriff ohne VPN auf aktuelle, relevante Daten über App/Web.
- Sicherheit: Trennung von Betriebs-/Admin-Daten und öffentlichen Daten.
- Skalierbarkeit: interne Struktur kann wachsen, während der externe Mini-Datenserver schlank und einfach bleibt.
