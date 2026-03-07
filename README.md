# smart-village
Dies ist eine Studienarbeit über das Thema Smart-Village an der DHBW-Lörrach. Teilnehmende Studierende Manuel Keßler, Leon Kühn, Nico Röcker, Alexander Shimaylo aus dem Kurs TIF 23. Betreuender Dozent: Herr Schenk

## Aktuelle Ergänzungen

- **Auto-Refresh & Discovery**: Die Admin-Oberfläche lädt Sensor- und Controller-Daten nun automatisch alle 5 Sekunden über den bestehenden `/villages/:id` API-Call nach. Das Intervall kann per `VITE_DISCOVERY_POLL_INTERVAL_MS` angepasst, die Funktion über `VITE_AUTO_REFRESH_ENABLED=false` deaktiviert werden. Neu entdeckte Geräte/Sensoren werden gebündelt in einer Toast-Notification angezeigt.
- **Mitfahrbank als Sensortyp**: Ein dedizierter Sensortyp „Mitfahrbank“ (Einheit: Personen) steht zur Verfügung. Wartende Personen werden als aktueller Messwert angezeigt und laufen über den gleichen MQTT/REST-Pfad wie andere Sensoren, inklusive Auto-Refresh und Discovery-Toast.
