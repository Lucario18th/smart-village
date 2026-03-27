# App-Übersicht (Android / Kotlin / Compose Multiplatform)

## Zweck

Dieses Dokument ordnet den aktuellen Stand der Android-App in die Struktur von `doku-Neu` ein.
Es beschreibt den nachweisbaren technischen Umfang aus dem Repository-Code (Semester 6) und verweist auf die Detaildokumentation.

## Technischer Stand (bestätigt im Code)

- Die App liegt unter `app/SmartVillageApp`.
- Architektur: Kotlin Multiplatform mit Compose Multiplatform.
- SourceSets: `commonMain`, `androidMain`, `iosMain`.
- Android-App-Version: `1.0.1` (`versionCode` 2).
- Navigation über Navigation3 (`NavDisplay` + typed destinations).
- Datenbezug über App-API (`/api/app/...`) und MQTT-Anbindung im App-Code.

Beispielhafte Code-Belege:

- `app/SmartVillageApp/composeApp/build.gradle.kts`
- `app/SmartVillageApp/composeApp/src/commonMain/kotlin/de/tif23/studienarbeit/App.kt`
- `app/SmartVillageApp/composeApp/src/commonMain/kotlin/de/tif23/studienarbeit/viewmodel/NavDestinations.kt`
- `app/SmartVillageApp/composeApp/src/commonMain/kotlin/de/tif23/studienarbeit/model/repository/`
- `app/SmartVillageApp/composeApp/src/androidMain/AndroidManifest.xml`

## Detaillierte App-Dokumentation

Die ausführliche, app-zentrierte Dokumentation befindet sich in:

- [`../../docs/README.md`](../../docs/README.md)

Dort enthalten sind u. a.:

- Architektur- und Komponentenbeschreibung
- Datenquellen und Kommunikation (REST/MQTT)
- Build, Ausführung und Konfiguration
- Qualitätssicherung und Grenzen der Aussagekraft
- Einordnung des Semester-5-PDFs

## Bezug zu Semester 5 (PDF)

Historische konzeptionelle Referenz:

- [`../abgage 5 semster/Entwicklungskonzepte für die App.pdf`](../abgage%205%20semster/Entwicklungskonzepte%20für%20die%20App.pdf)

Das PDF wird ausschließlich referenziert und nicht verändert.
