# Frontend-Übersicht

## Überblick

Das Frontend ist ein Web-Dashboard zur Verwaltung von Gemeinden, Sensoren und Geräten.
Es ist als Single-Page-Application (SPA) mit React 18 und Vite gebaut.
Der Quellcode befindet sich im Verzeichnis `website/`.

Das Dashboard richtet sich an Gemeindeverantwortliche, die ihre IoT-Infrastruktur verwalten möchten.

## Technologie-Stack

| Technologie | Version | Zweck |
|-------------|---------|-------|
| React | 18.2 | UI-Framework |
| Vite | 5.0 | Build-Tool und Entwicklungsserver |
| Leaflet / React-Leaflet | 1.9 / 4.2 | Kartenkomponente (OpenStreetMap) |
| MSW (Mock Service Worker) | 2.x | Mocking für die Entwicklung |
| Vitest | 1.6 | Unit-Tests |
| CSS | — | Theming mit 6 Varianten |

## Projektstruktur

```
website/
├── src/
│   ├── main.jsx            ← Einstiegspunkt
│   ├── App.jsx             ← Routing und Zustandsverwaltung
│   ├── api/
│   │   └── client.js       ← Zentraler API-Client
│   ├── auth/
│   │   ├── session.js      ← Session-Verwaltung (JWT, LocalStorage)
│   │   └── accounts.js     ← Testkonten-Anzeige
│   ├── config/
│   │   ├── configModel.js      ← Gemeinde-Konfigurationsmodell
│   │   ├── configStorage.js    ← LocalStorage-Persistenz
│   │   ├── adminSections.js    ← Navigation (Menüeinträge)
│   │   └── themeManager.js     ← Theme-Verwaltung
│   ├── hooks/
│   │   ├── useAdminAuth.js     ← Authentifizierungs-Hook
│   │   ├── useVillageConfig.js ← Haupthook für Gemeindedaten
│   │   └── useMqttLiveReadings.js ← Live-Messwerte per MQTT im Browser
│   ├── components/
│   │   ├── LoginView.jsx           ← Anmeldeformular
│   │   ├── RegisterView.jsx        ← Registrierungsformular
│   │   ├── EmailVerificationPending.jsx ← E-Mail-Verifizierung
│   │   ├── EmailVerifiedView.jsx   ← Verifizierung erfolgreich
│   │   ├── DeleteAccountDialog.jsx ← Kontolöschung (Dialog)
│   │   ├── LocationAutocomplete.jsx ← PLZ-/Ortssuche
│   │   ├── AdminView.jsx          ← Haupt-Dashboard
│   │   └── admin/
│   │       ├── AdminNavigation.jsx      ← Seitenleiste
│   │       ├── AdminSectionPanel.jsx    ← Inhaltsrouter
│   │       ├── MapPanel.jsx             ← Kartenansicht
│   │       └── forms/
│   │           ├── GeneralSettingsForm.jsx   ← Allgemeine Einstellungen
│   │           ├── ModulesSettingsForm.jsx   ← Modul-Verwaltung
│   │           ├── SensorsSettingsForm.jsx   ← Sensor- und Geräteverwaltung
│   │           ├── StatisticsForm.jsx        ← Statistik-Ansicht
│   │           └── DesignSettingsForm.jsx    ← Theme-Einstellungen
│   ├── utils/
│   │   ├── geocoding.js    ← Geocoding über Nominatim
│   │   └── mapViewUtils.js ← Kartenberechnung und Marker
│   ├── mocks/
│   │   ├── browser.js      ← MSW-Initialisierung
│   │   ├── handlers.js     ← Mock-Endpunkte
│   │   └── mockData.js     ← Mock-Daten
│   ├── css/                ← Theme-CSS-Dateien
│   └── styles.css          ← Globale Styles
├── public/                 ← Statische Dateien (MSW Service Worker)
├── package.json
├── index.html
├── Dockerfile
└── vite.config.js
```

## Anwendungszustände

Die App.jsx-Komponente steuert, welche Ansicht angezeigt wird.
Es gibt keinen traditionellen Router (wie React Router).
Stattdessen wird der Zustand über eine Zustandsvariable (`view`) verwaltet.

| Zustand | Ansicht | Bedingung |
|---------|---------|-----------|
| Nicht angemeldet | LoginView | Kein gültiger Token |
| Registrierung | RegisterView | Benutzer klickt auf "Registrieren" |
| E-Mail-Verifizierung | EmailVerificationPending | E-Mail noch nicht verifiziert |
| Verifiziert | EmailVerifiedView | E-Mail erfolgreich verifiziert |
| Angemeldet | AdminView | Gültiger Token vorhanden |

Im Public-/User-Bereich werden angezeigte Tabs dynamisch aus den Village-Feature-Flags erzeugt.
Deaktivierte Module (z. B. Karte, Wetter, Events) werden komplett ausgeblendet.

Die ausgewaehlte Gemeinde wird im Browser persistiert.
Beim ersten Laden wird bevorzugt die letzte Auswahl genutzt, sonst Gemeinde-ID 1 (falls vorhanden).

## Theming

Das Frontend unterstützt sechs Theme-Varianten:

| Modus | Kontrast | CSS-Klasse |
|-------|----------|-----------|
| Hell | Standard | `light` |
| Hell | Mittel | `light-medium-contrast` |
| Hell | Hoch | `light-high-contrast` |
| Dunkel | Standard | `dark` |
| Dunkel | Mittel | `dark-medium-contrast` |
| Dunkel | Hoch | `dark-high-contrast` |

Das Theme wird über CSS-Klassen auf dem `<html>`-Element gesteuert.
Der ThemeManager in `config/themeManager.js` sorgt dafür, dass die richtige Klasse gesetzt wird.
Die Theme-Auswahl wird in der Gemeinde-Konfiguration gespeichert.

## Entwicklung

### Lokaler Entwicklungsserver

```bash
cd website
npm install
npm run dev
```

Der Vite-Entwicklungsserver startet und ist unter `http://localhost:5173` erreichbar.
In der Entwicklung wird MSW (Mock Service Worker) automatisch aktiviert.
Damit können alle API-Aufrufe ohne laufendes Backend getestet werden.

### Build

```bash
npm run build
```

Erstellt optimierte statische Dateien im Verzeichnis `dist/`.
Diese werden im Docker-Container von Nginx ausgeliefert.

### Tests

```bash
npm run test
```

Führt die Vitest-Tests aus.

## Entwurfsentscheidungen

**Warum kein React Router?**
Die Anwendung hat eine relativ einfache Navigationsstruktur.
Vermutlich wurde auf einen Router verzichtet, weil die zustandsbasierte Steuerung für die vorhandenen Ansichten ausreichend ist.

**Warum MSW statt eines separaten Mock-Servers?**
MSW fängt Anfragen direkt im Browser ab, ohne dass ein zusätzlicher Server laufen muss.
Das vereinfacht das Setup für die Frontend-Entwicklung und ermöglicht realitätsnahes Testen.

**Warum Leaflet statt Google Maps?**
Leaflet verwendet OpenStreetMap-Daten, die kostenlos und ohne API-Schlüssel nutzbar sind.
Für ein Studienprojekt ist das eine pragmatische Wahl, die keine externen Kosten verursacht.
