# App Übersicht

In diesem Dokument wird die Architektur, Struktur und Beschaffenheit der Smart-Village Companion App beschrieben.

## Struktur der App
Die App wurde als **Compose Multiplatform** Projekt aufgesetzt, welches im Kern aus verschiedenen Modulen besteht:

```text
app/
└── SmartVillageApp/
    ├── composeApp/                 ← Hauptmodul für die Multiplatform-Applikation
    │   ├── src/
    │   │   ├── commonMain/         ← Geteilter Code für Geschäftslogik, UI und ViewModels (wird von allen Plattformen genutzt)
    │   │   ├── androidMain/        ← Android-spezifische Implementierungen (z. B. Einstiegspunkt MainActivity, System-Interfaces)
    │   │   └── iosMain/            ← iOS-spezifische Implementierungen im Kotlin-Code
    │   └── build.gradle.kts        ← Build-Skript für das Compose-Modul
    ├── iosApp/                     ← Natives Xcode-Projekt für iOS
    │   ├── iosApp/
    │   │   ├── ContentView.swift   ← Brücke zwischen nativer iOS-UI und der Compose Multiplatform UI
    │   │   └── iOSApp.swift        ← Nativer Einstiegspunkt für iOS
    │   └── iosApp.xcodeproj/       ← Xcode Projekt-Datei
    ├── gradle/                     ← Gradle-Einstellungen und Abhängigkeitsmanagement
    │   └── libs.versions.toml      ← Zentrale Verwaltung aller Plugin- und Bibliotheksversionen
    ├── build.gradle.kts            ← Top-Level Build-Skript
    └── settings.gradle.kts         ← Einstellungen für das Gradle-Projekt
```

## Wichtigste Bibliotheken und Versionen
Die App verwendet moderne Kotlin-Technologien, um eine plattformübergreifende Entwicklung zu ermöglichen. Die zentralen Bibliotheken sind:
- **Kotlin Version:** `2.3.10`
- **Compose Multiplatform:** `1.10.1` (UI-Framework)
- **Ktor Client:** `3.4.0` (REST-API Kommunikation)
- **KMQTT:** `1.0.0` (MQTT-Client für Echtzeitdaten)
- **Multiplatform Settings:** `1.3.0` (Lokale Schlüssel-Wert-Speicherung)
- **Mapcompose-MP:** `0.12.0` (Darstellung von Karten)
- **Kotlinx Serialization:** `1.10.0` (JSON-Verarbeitung)

## Design
Die Benutzeroberfläche der App folgt den Richtlinien von **Material Design 3**. Durch die Nutzung von Compose Multiplatform werden moderne, reaktive UI-Komponenten verwendet, welche sich nahtlos an verschiedene Bildschirmgrößen anpassen (`material3 = "1.10.0-alpha05"`). 

## Softwarearchitektur: MVVM
Die Applikation ist nach dem **Model-View-ViewModel (MVVM)** Architekturmuster aufgebaut, um eine saubere Trennung von Geschäftslogik und Benutzeroberfläche zu gewährleisten:
- **Model:** Beinhaltet die Datenstruktur, lokale Datenspeicherung (`Multiplatform Settings`), API-Aufrufevia `Ktor` und die Datenversorgung über `KMQTT`.
- **ViewModel:** Fungiert als Bindeglied zwischen Model und View. Es hält und verwaltet den UI-Zustand (State), verarbeitet Nutzereingaben und führt die Geschäftslogik aus.
- **View:** Declarative Compose-Funktionen, die den State aus den ViewModels beobachten (z. B. via StateFlow) und sich bei Änderungen automatisch neu rendern.

## Getestete Geräte
Da im Rahmen des Projekts keine Mac-Hardware zur Verfügung stand, konnte die App nicht für iOS kompiliert oder getestet werden. **Daher wurde die App ausschließlich für und auf Android-Geräten getestet.**
Verwendete Test-Geräte:
- **Google Pixel 9 Pro** (im Android-Simulator)
- **Google Pixel 7a** (als physisches Endgerät)

## Release & Quick-Start
Die fertige, kompilierte App-Version kann über die GitHub-Page des Projekts heruntergeladen werden.

**Quick-Start Anweisungen zur Installation:**
1. Lade dir die aktuelle APK-Datei von den [GitHub-Releases](https://github.com/Lucario18th/smart-village/releases/tag/v1_0_1) herunter.
2. Übertrage die `.apk` Datei auf dein Android-Gerät (falls du sie dort nicht direkt heruntergeladen hast).
3. Tippe auf die Datei, um sie zu installieren. Falls nötig, erteile deinem Dateimanager oder Browser die Berechtigung, Apps aus unbekannten Quellen zu installieren.
4. Öffne die „Smart Village“ App, gib ggf. Serverinformationen ein und starte!

**Quick-Start für Ausführung in Entwicklungsumgebung:**
- Android:
  1. Öffne `smart-village/app/SmartVillageApp/` in Android Studio.
  2. Oben in der Toolbar die Run-Konfiguration auf `app` setzen.
  3. Ein Android-Gerät oder Emulator auswählen und auf Run klicken.
  - Alternativ über die Kommandozeile:
  ```bash
  cd app/SmartVillageApp
  ./gradlew :composeApp:assembleDebug
  ./gradlew installDebug
  adb shell am start -n "de.tif23.studienarbeit/de.tif23.studienarbeit.MainActivity"
  ```
- iOS:
  1. Öffne `smart-village/app/iosApp/iosApp.xcodeproj` in Xcode.
  2. Wähle ein iOS-Simulatorgerät aus und klicke auf Run.