# Meeting – Datum: TBD

## Agenda

1. Status Studienarbeit
2. Weiteres Vorgehen

---

## 1. Präsentation aktueller Stand

### Website (Nico)
- Vorstellung der aktuellen Website
- Implementierte Features
- Offene Punkte

### App (Manuel)
- Vorstellung der Mobile App
- Implementierte Features
- Offene Punkte

### Datenbank-Architektur (Alex)
- Vorstellung des DB-Schemas (3NF)
- Tabellenstruktur:
  - Accounts, Villages, Users
  - Sensor Types, Sensors, Sensor Status
  - Sensor Readings (Zeitreihen)
- Begründung der Architekturentscheidungen

### Server & Backend (Leon)
- Server-Infrastruktur und Deployment-Konzept
- Backend-Architektur (FastAPI)
- Netzwerkkonzept:
  - Internes System (Admin-Zugriff über VPN)
  - Externes System (Mini-Datenserver für User ohne VPN)
  - Datensynchronisation zwischen beiden Systemen
- Docker-Setup und CI/CD mit GitHub Actions

---

## 2. Weiteres Vorgehen

### Nächste Schritte
- [ ] Integration von Frontend, App und Backend
- [ ] Testphase mit simulierten Sensordaten
- [ ] Dokumentation vervollständigen
- [ ] Präsentation vorbereiten

### Offene Fragen
- Deployment-Zeitplan?
- Sensor-Hardware: welche konkreten Geräte?
- Testdaten: wer erstellt Beispiel-Sensordaten?

### Aufgabenverteilung
- **Nico**: Website
- **Manuel**: Mobile App
- **Alex**: Datenbank
- **Leon**: Server & Backend

---

## Notizen

_(Hier während des Meetings ergänzen)_

---

## Nächstes Meeting

- Datum: TBD
- Thema: TBD
