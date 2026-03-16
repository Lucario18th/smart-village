# smart-village
Dies ist eine Studienarbeit über das Thema Smart-Village an der DHBW-Lörrach. Teilnehmende Studierende Manuel Keßler, Leon Kühn, Nico Röcker, Alexander Shimaylo aus dem Kurs TIF 23. Betreuender Dozent: Herr Schenk

## Dokumentation

Die vollständige technische Dokumentation befindet sich im Verzeichnis [`docs/`](docs/README.md).
Sie enthält eine Projektübersicht, Architektur- und Komponentenbeschreibungen, API-Referenz, Deployment-Anleitungen und Prozessbeschreibungen.

## Aktuelle Ergänzungen

- **Auto-Refresh & Discovery**: Die Admin-Oberfläche lädt Sensor- und Controller-Daten nun automatisch alle 5 Sekunden über den bestehenden `/villages/:id` API-Call nach. Das Intervall kann per `VITE_DISCOVERY_POLL_INTERVAL_MS` angepasst, die Funktion über `VITE_AUTO_REFRESH_ENABLED=false` deaktiviert werden. Neu entdeckte Geräte/Sensoren werden gebündelt in einer Toast-Notification angezeigt.
- **Mitfahrbank als Sensortyp**: Ein dedizierter Sensortyp „Mitfahrbank“ (Einheit: Personen) steht zur Verfügung. Wartende Personen werden als aktueller Messwert angezeigt und laufen über den gleichen MQTT/REST-Pfad wie andere Sensoren, inklusive Auto-Refresh und Discovery-Toast.
- **Öffentliche Gemeindekarte**: Die OSM-Karte besitzt nun einen Auswahlbaum für Controller und Sensoren (inkl. Mitfahrbänken). Checkboxen für Controller blenden alle zugehörigen Sensoren ein/aus; einzelne Sensoren lassen sich separat steuern. Marker nutzen Sensorkoordinaten oder fallen auf die Geräte-Position zurück. Farben zeigen Messwert-Buckets (blau/gelb/rot) an, Mitfahrbänke folgen der Regel grün=0, orange=1–2, rot=3+. Neue Sensor- oder Gerätetypen erscheinen automatisch; Markerfarbe kann über `deriveMarkerColor` in `mapViewUtils` erweitert werden.
