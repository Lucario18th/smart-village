# Komponentenstruktur

## Überblick

Das Frontend besteht aus mehreren React-Komponenten, die hierarchisch aufgebaut sind.
Die Hauptkomponente `App.jsx` steuert den Anwendungszustand und rendert je nach Situation die passende Ansicht.

## Komponentenhierarchie

```
App.jsx
├── LoginView
├── RegisterView
│   └── LocationAutocomplete
├── EmailVerificationPending
├── EmailVerifiedView
└── AdminView
    ├── AdminNavigation
    ├── AdminSectionPanel
    │   ├── MapPanel
    │   │   ├── SelectionTree
    │   │   └── MapContainer (React-Leaflet)
    │   ├── GeneralSettingsForm
    │   │   └── LocationAutocomplete
    │   ├── ModulesSettingsForm
    │   ├── SensorsSettingsForm
    │   │   ├── DeviceRow / DeviceForm
    │   │   └── SensorRow / SensorForm
    │   ├── StatisticsForm
    │   └── DesignSettingsForm
    └── DeleteAccountDialog
```

## Authentifizierungs-Komponenten

### LoginView

Zeigt das Anmeldeformular mit E-Mail und Passwort an.
Bei erfolgreicher Anmeldung wird der Callback `onLogin` aufgerufen.
Über einen Link kann zur Registrierung gewechselt werden.
Fehlermeldungen werden bei falschen Anmeldedaten angezeigt.

### RegisterView

Zeigt das Registrierungsformular an.
Es enthält Felder für E-Mail, Passwort, Gemeindename und Standort.
Die Standortauswahl nutzt die LocationAutocomplete-Komponente.
Nach erfolgreicher Registrierung wird der Callback `onRegister` aufgerufen.

### EmailVerificationPending

Wird nach der Registrierung angezeigt, wenn die E-Mail noch nicht verifiziert ist.
Zeigt ein Eingabefeld für den 6-stelligen Verifizierungscode.
Ein Countdown von 5 Minuten zeigt die verbleibende Gültigkeitsdauer.
Ein Button zum erneuten Senden des Codes ist vorhanden.

### EmailVerifiedView

Wird nach erfolgreicher E-Mail-Verifizierung angezeigt.
Zeigt eine Bestätigungsmeldung und einen Button, um zur Anmeldung zurückzukehren.

## Dashboard-Komponenten

### AdminView

Die zentrale Dashboard-Komponente nach der Anmeldung.
Sie verwendet den Hook `useVillageConfig`, um die Gemeindedaten zu laden und zu verwalten.
Die Ansicht ist in eine Seitenleiste (AdminNavigation) und einen Inhaltsbereich (AdminSectionPanel) aufgeteilt.

### AdminNavigation

Die Seitenleiste mit den Navigationseinträgen.
Die Einträge sind in `config/adminSections.js` definiert:

| ID | Label | Beschreibung |
|----|-------|-------------|
| map | Home | Gemeindekarte mit Sensoren und Geräten |
| general | Allgemein | Allgemeine Einstellungen der Gemeinde |
| modules | Module | Module und Dienste aktivieren/deaktivieren |
| sensors | Sensoren | Sensor- und Geräteverwaltung |
| statistics | Statistiken | Sensor-Statistiken |
| design | Einstellungen | Theme und Darstellung |

### AdminSectionPanel

Routet basierend auf dem ausgewählten Navigationseintrag zur passenden Formular-Komponente.

## Formular-Komponenten

### GeneralSettingsForm

Bearbeitung der allgemeinen Gemeindedaten:
- Gemeindename
- Gemeindekennziffer (municipalityCode)
- Kontakt-E-Mail
- Kontakttelefon (Validierung: mindestens 10 Zeichen)
- Statustext
- Informationstext
- Postleitzahl und Ort (über LocationAutocomplete)

Das Formular hat einen Bearbeitungsmodus.
Beim Aktivieren wird ein Snapshot des aktuellen Zustands erstellt.
Beim Abbrechen wird der Snapshot wiederhergestellt.
Beim Speichern werden die Änderungen über den API-Client an das Backend gesendet.

### ModulesSettingsForm

Verwaltet die aktivierten Module der Gemeinde.
Jedes Modul kann einzeln aktiviert oder deaktiviert werden.

Verfügbare Module:
- Sensoren
- Wetter
- Nachrichten (News)
- Veranstaltungen (Events)
- Karte
- Mitfahrbank
- Altkleidercontainer

Die Module werden als Karten (ServiceCards) dargestellt, die per Toggle umgeschaltet werden können.

**Anmerkung:** Die Module werden aktuell nur im Frontend verwaltet und im LocalStorage gespeichert. Eine vollständige Backend-Unterstützung für die Modulkonfiguration scheint noch nicht implementiert zu sein.

### SensorsSettingsForm

Die umfangreichste Formular-Komponente (ca. 684 Zeilen).
Sie verwaltet sowohl Geräte als auch Sensoren.

**Geräteverwaltung:**
- DeviceRow zeigt ein Gerät mit Name, ID, Koordinaten und angeschlossenen Sensoren.
- DeviceForm erlaubt die Bearbeitung von Name und Koordinaten.
- Neue Geräte können hinzugefügt werden.
- Ein Discovery-Badge zeigt an, wenn ein Gerät über MQTT neu entdeckt wurde.

**Sensorverwaltung:**
- SensorRow zeigt einen Sensor mit Typ, aktuellem Wert, Status und Zeitstempel.
- Für Mitfahrbank-Sensoren wird die Anzahl wartender Personen angezeigt.
- Farbcodierte Statusanzeigen: OK (grün), WARN (gelb), ERROR (rot), CRITICAL (dunkelrot).
- SensorForm erlaubt die Bearbeitung von Name, Typ, Beschreibung, Gerätezuordnung und Koordinaten.
- Der Sensortyp ist gesperrt, wenn er über MQTT-Discovery gesetzt wurde.

### StatisticsForm

Zeigt Statistiken über die Sensoren der Gemeinde:
- Gesamtanzahl der Sensoren
- Aktive und inaktive Sensoren
- Sensoren nach Typ gruppiert
- Detaillierte Tabelle mit allen Sensoren und ihrem aktuellen Status

Diese Komponente ist rein darstellend und hat keine Bearbeitungsfunktion.

### DesignSettingsForm

Erlaubt die Auswahl des Themes:
- Modus: Hell oder Dunkel
- Kontrast: Standard, Mittel oder Hoch
- Symbolsatz (Icon-Set)

Änderungen werden sofort auf die Oberfläche angewendet über `applyThemeToDOM()`.
Die Auswahl wird in der Gemeinde-Konfiguration gespeichert.

## Kartenkomponenten

### MapPanel

Die interaktive Kartenansicht basierend auf React-Leaflet und OpenStreetMap.

**Funktionen:**
- Zeigt alle Sensoren und Geräte als Marker auf der Karte.
- Die Karte zentriert sich automatisch auf den Standort der Gemeinde (Geocoding über Nominatim).
- Ein SelectionTree (Checkbox-Baum) erlaubt das Filtern nach Geräten und Sensoren.
- Marker sind farbcodiert:
  - Rot: Standort der Gemeinde
  - Dunkelgrau: Geräte/Controller
  - Blau bis Rot (Gradient): Sensorwerte (niedrig bis hoch)
  - Lila: Sensor ohne Daten

**MapViewportSync:** Synchronisiert den Kartenausschnitt, wenn das Panel geöffnet oder geschlossen wird.

**MarkerPopupContent:** Zeigt bei Klick auf einen Marker Details zum Sensor oder Gerät an.

## Weitere Komponenten

### LocationAutocomplete

Autovervollständigung für Postleitzahlen und Ortsnamen.
Ruft den Endpunkt `GET /api/locations/search` auf, während der Benutzer tippt.
Wird in RegisterView und GeneralSettingsForm verwendet.

### DeleteAccountDialog

Ein modaler Dialog für die Kontolöschung.
Wird nur angezeigt, wenn der angemeldete Benutzer Administrator ist.
Der Benutzer muss die E-Mail-Adresse des zu löschenden Kontos eingeben, um die Löschung zu bestätigen.
Ruft `DELETE /api/admin/accounts/:accountId` auf.
