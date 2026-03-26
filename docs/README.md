# Technische Dokumentation – App (Compose Multiplatform / Kotlin Multiplatform)

## Zweck der Dokumentation

Dieses Dokument beschreibt den **aktuellen technischen Stand der App in Semester 6** auf Basis des Repository-Codes, mit Fokus auf:

- Architektur und Komponenten
- Funktionsumfang und Datenfluss
- Schnittstellen zur Backend-Plattform
- Build-/Run-Informationen und Konfiguration
- Qualitäts- und Entwicklungsaspekte
- Einordnung der Konzepte aus Semester 5 (PDF)

Die Aussagen sind bewusst auf belegbare Codefunde begrenzt. Nicht eindeutig nachweisbare Punkte werden explizit markiert.

## Aktueller App-Stand (Semester 6)

Der App-Teil befindet sich unter `app/SmartVillageApp` und nutzt Compose Multiplatform mit KMP-SourceSets für `commonMain`, `androidMain` und `iosMain`.

Bestätigter Funktionsumfang (Code-basiert):

- Dorfauswahl (Splash) und persistierte Auswahl (`SelectedVillageSettingsStore`)
- Hauptansicht mit Karten-/Umweltdatenbezug (`MainScreen`, `MainViewModel`)
- Sensormodule inkl. Detailansichten (`SensorsScreen`, `SensorDetailScreen`)
- Nachrichtenansichten (`MessagesScreen`)
- Modulübersicht und Moduldetails (`ModulesScreen`, `ModuleDetailScreen`)
- Mobilitätsfunktionen inkl. Mitfahr-bezogener Screens (`MobilityScreen`, `RideOfferScreen`, `RideDetailsScreen`, `RidesharePointDetailScreen`)
- Fahrplanauskünfte (`StationDeparturesScreen`, `TimeTableRepository`)
- Einstellungen inkl. Dorfwechsel/Theme-Einstellungen (`SettingsScreen`, `SettingsViewModel`)

Relevante Belege:

- `app/SmartVillageApp/composeApp/src/commonMain/kotlin/de/tif23/studienarbeit/App.kt`
- `app/SmartVillageApp/composeApp/src/commonMain/kotlin/de/tif23/studienarbeit/viewmodel/NavDestinations.kt`
- `app/SmartVillageApp/composeApp/src/commonMain/kotlin/de/tif23/studienarbeit/ui/screens/`
- `app/SmartVillageApp/composeApp/src/commonMain/kotlin/de/tif23/studienarbeit/viewmodel/`

## Architektur & Komponenten der App

### Struktur

- Root-Projekt: `app/SmartVillageApp`
- App-Modul: `app/SmartVillageApp/composeApp`
- SourceSets:
  - Shared: `composeApp/src/commonMain`
  - Android: `composeApp/src/androidMain`
  - iOS: `composeApp/src/iosMain`

Build-Definitionen:

- `app/SmartVillageApp/settings.gradle.kts`
- `app/SmartVillageApp/build.gradle.kts`
- `app/SmartVillageApp/composeApp/build.gradle.kts`

### Schichten (belegt im Code)

- **UI-Schicht:** Composables unter `ui/screens` und `ui/components`
- **ViewModel-Schicht:** Zustandsverwaltung über `StateFlow` in `viewmodel/*`
- **Domain/UseCase-Schicht:** `model/usecase/*`
- **Daten-/Repository-Schicht:** `model/repository/*`
- **DTO/Mapping:** `model/data/*`, `model/data/responses/*`, `model/RemoteToDomain.kt`

### Navigation

Navigation wird über Navigation3 (`NavDisplay`, typed destinations) umgesetzt.

- Einstiegspunkt: `App.kt`
- Ziele: `NavDestinations.kt` (u. a. `MainScreen`, `SensorScreen`, `ModulesScreen`, `SettingsScreen`, `SplashScreen`)

## Datenquellen und Kommunikation

### REST (App-Backend)

Bestätigte Basis-URL:

- `SERVER_URL = "https://192.168.23.113/api/app"` in `model/constants/Url.kt`

Bestätigte Endpunkte im App-Code:

- `GET /villages` (`VillagesRepository.getVillages`)
- `GET /villages/{id}/config` (`VillagesRepository.getVillageConfig`)
- `GET /villages/{villageId}/initial-data` (`SensorRepository.getInitialData`)
- `GET /villages/{villageId}/modules` (`SensorRepository.getModules`)

Belege:

- `model/constants/Url.kt`
- `model/repository/VillagesRepository.kt`
- `model/repository/SensorRepository.kt`

### MQTT (Echtzeitdaten)

Bestätigt im App-Code:

- Subscription in `MqttClientProvider`: `"/api/app/village/$villageId/sensors/#"`
- Filter in `MqttSensorRepository`: `"api/app/village/$villageId/sensors"`

Hinweis: Diese Topic-Strings sind im Code **inkonsistent** (führender `/` in der Subscription, keiner im Filter) und werden hier rein deskriptiv dokumentiert.

Belege:

- `provider/MqttClientProvider.kt`
- `model/repository/MqttSensorRepository.kt`

### Externe API

Zusätzlich wird die Deutsche-Bahn-Timetable-API genutzt:

- `DB_TIMETABLES_API_URL = "https://apis.deutschebahn.com/db-api-marketplace/apis/timetables/v1"`
- Header mit `BuildKonfig.DB_CLIENT_ID` und `BuildKonfig.DB_CLIENT_SECRET`

Belege:

- `model/constants/Url.kt`
- `model/repository/TimeTableRepository.kt`
- `composeApp/build.gradle.kts` (BuildKonfig-Felder)

## Build, Ausführung, Konfiguration

### Nachweisbare Build-Konfiguration

- Android Target/JVM 11: `composeApp/build.gradle.kts`
- App-Version: `versionName = "1.0.1"`, `versionCode = 2`
- SDKs: compile/target 36, min 24 (`gradle/libs.versions.toml` + `composeApp/build.gradle.kts`)
- KMP-Ziele: `androidTarget`, `iosArm64`, `iosSimulatorArm64`

### Nachweisbare Build-/Run-Hinweise im Repo

- `app/SmartVillageApp/README.md` nennt:
  - `./gradlew :composeApp:assembleDebug` (macOS/Linux)
  - `./gradlew.bat :composeApp:assembleDebug` (Windows)

### Konfiguration

- BuildKonfig liest aus `infra/smartvillage.env`:
  - `DB_CLIENT_ID`
  - `DB_CLIENT_SECRET`
- Fehlende Werte führen im Build zu Fehler (`error(...)` in `composeApp/build.gradle.kts`)

### Android-Berechtigungen

In `AndroidManifest.xml` bestätigt:

- `INTERNET`
- `ACCESS_NETWORK_STATE`
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`

Zusätzlich gesetzt:

- `android:networkSecurityConfig="@xml/network_security_config"`

`network_security_config.xml` erlaubt für `192.168.23.113` unter anderem `cleartextTrafficPermitted="true"` und System-/User-Zertifikate.

## Qualitätssicherung & Tests

### Nachweisbare Test-/Qualitätsartefakte im App-Teil

- `commonTest`-Dependency ist deklariert (`kotlin.test`), siehe `composeApp/build.gradle.kts`
- Im App-Teil wurden keine konkreten Testdateien (`*Test*.kt`) gefunden

### Fehlerbehandlung (im Code erkennbar)

- Repositories nutzen `try/catch` mit Fallbacks (z. B. leere Listen) oder Re-Throws
- ViewModels nutzen `runCatching { ... }.onSuccess/onFailure` mit `errorMessage` im UI-State

Belege:

- `model/repository/VillagesRepository.kt`
- `viewmodel/SensorViewModel.kt`, `viewmodel/MessagesViewModel.kt`
- `viewmodel/data/state/*`

### Validierungsstatus in dieser Bearbeitung

Vor den Dokumentationsänderungen wurden vorhandene Test-/Build-Befehle ausgeführt:

- `backend`: `npm test` → fehlgeschlagen, da `jest` nicht installiert (`not found`)
- `website`: `npm test` → fehlgeschlagen, da `vitest` nicht installiert (`not found`)
- `app`: Gradle-Wrapper-Aufruf in Linux-Shell fehlgeschlagen (CRLF-Line-Endings im `gradlew`-Script in dieser Umgebung)

Diese Ergebnisse sind Umgebungs-/Setup-bedingt und keine Aussage über fachliche Korrektheit der Dokuinhalte.

## Bezug zu den Entwicklungskonzepten aus Semester 5 (PDF)

Referenzdokument:

- `doku-Neu/abgage 5 semster/Entwicklungskonzepte für die App.pdf`

### Gegenüberstellung

| Kategorie aus dem PDF | Im aktuellen App-Stand erkennbar umgesetzt | Erweitert / verändert in Semester 6 | Nicht verifiziert im aktuellen Code |
|---|---|---|---|
| KMP als Technologiegrundlage | Ja: Compose Multiplatform + KMP-SourceSets (`commonMain/androidMain/iosMain`) | Ja: konkrete Navigation, Screen-Landschaft und produktiver Funktionsumfang deutlich ausgebaut | – |
| BuildKonfig für zentrale Konstanten | Ja: BuildKonfig-Plugin aktiv, DB-Headerwerte aus `infra/smartvillage.env` | Teilweise: Im gezeigten Code wird BuildKonfig für DB-API-Credentials genutzt; API-Basis-URL ist zugleich als Konstante in `Url.kt` hinterlegt | Ob BuildKonfig für mandantenspezifische App-Branding-Parameter breit genutzt wird, nicht eindeutig im Code bestätigt |
| Mehr-Mandanten-Idee / Dorf-Kontext | Teilweise: Dorfauswahl und persistierte Auswahl vorhanden; Backend-Calls sind dorfbezogen | Ja: konkrete App-Features pro Dorfkontext (Module, Sensoren, Nachrichten etc.) sichtbar | Vollständige mandantengetrennte Wrapper-Modul-Strategie (pro Dorf eigene App-Artefakte/Icons) nicht eindeutig im Code bestätigt |
| Echtzeitkonzept (Sensoren) | Ja: MQTT-Provider und Sensor-Update-Flow vorhanden | Ja: Kombination aus REST-Initialdaten und MQTT-/Polling-Pfaden erkennbar | End-to-End-Verhalten in realer Infrastruktur nicht im Repository-Code allein verifizierbar |
| Backend-/Technologievergleich aus PDF | Nicht direkt Gegenstand des App-Codes | Semester 6 zeigt integrierte Nutzung der bereitgestellten Schnittstellen | Vergleichsaussagen zu damals evaluierten Alternativen sind im aktuellen App-Code nicht verifizierbar |

## Grenzen der Aussagekraft

- Das Dokument basiert auf statischer Repository-Analyse und nicht auf Feldtests.
- Laufzeitverhalten (z. B. reale MQTT-Zustellung, Netzwerktopologien, produktive Last) ist aus Code allein nur begrenzt ableitbar.
- Aussagen zu iOS-Laufzeit und App-Store-/Release-Prozessen sind **nicht eindeutig im Code bestätigt**.
- Vollständige Multi-Tenant-Wrapper-Strategie aus dem Semester-5-PDF ist im aktuellen Repository-Layout **nicht eindeutig im Code bestätigt**.
- Das PDF wurde referenziert und inhaltlich eingeordnet, aber nicht verändert.

## Verweise

- `../README.md`
- `./PROJEKT-DOKUMENTATION.md`
- `./KI-NUTZUNG.md`
- `../app/README.md`
- `../app/SmartVillageApp/README.md`
- `../app/SmartVillageApp/composeApp/build.gradle.kts`
- `../app/SmartVillageApp/composeApp/src/commonMain/kotlin/de/tif23/studienarbeit/`
- `../app/SmartVillageApp/composeApp/src/androidMain/AndroidManifest.xml`
- `../doku-Neu/abgage 5 semster/Entwicklungskonzepte für die App.pdf`
