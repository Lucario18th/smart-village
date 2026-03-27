# Architekturentscheidungen der Smart Village App

Dieses Dokument hält die zentralen architektonischen und konzeptionellen Entscheidungen für die App fest. Es baut auf den Grundlagen aus dem Dokument ["Entwicklungskonzepte für die App" (aus dem 5. Semester)](../abgabe-semester-5/Entwicklungskonzepte%20für%20die%20App.pdf) auf und spezifiziert die weitere Umsetzung.

## 1. Mehr-Mandanten-Fähigkeit (Multi-Tenancy)

**Entscheidung:**
Die Mehr-Mandanten-Fähigkeit wurde über eine dynamische Dorfauswahl beim ersten Start der App realisiert, anstatt für jedes Dorf eine eigenständige App-Version (White-Labeling) in den App Stores zu veröffentlichen. 

**Begründung & Auswirkungen:**
*   **Benutzerfreundlichkeit beim Wechsel:** Bürger können flexibel ihr Dorf-Profil ändern, wenn sie beispielsweise ein anderes Dorf besuchen oder dorthin umziehen, welches ebenfalls an das Smart-Village-Netzwerk angebunden ist. Dies erfordert **keine neue App-Installation**.
*   **Funktionsumfang:** Alle geplanten Kernfunktionen für die Dörfer sind durch diesen Ansatz vollständig umsetzbar.
*   **Einschränkung:** Einziger Wermutstropfen bei diesem Ansatz ist, dass kein individuelles App-Icon pro Dorf auf dem Smartphone-Homescreen eingerichtet werden kann – das Icon bleibt für die generische „Smart Village“-App bestehen. Diese Einschränkung wurde zugunsten des reduzierten Entwicklungs- und Wartungsaufwands (nur eine App in den Stores) bewusst in Kauf genommen.

## 2. Zusammenlegung der Backends

**Entscheidung:**
Das App-Backend wurde mit dem gesamten (Rest-)Backend vollständig gemergt.

**Begründung & Auswirkungen:**
*   **Einfachheit (Simplicity):** Durch den Zusammenschluss der Backends für die Sensoren und die Webseite wird die AppSystemarchitektur erheblich vereinfacht.
*   **Zentrale Pflege:** Es muss nicht zwischen einem "Frontend-Backend" und einem dedizierten "App-Backend" differenziert werden. Datenmodelle, Authentifizierung und Geschäftslogik werden zentral an einer Stelle gepflegt. API-Routen konnten so vereinheitlicht werden.

## 3. Wahl der Technologie: Kotlin Multiplatform (KMP) & Compose Multiplatform

**Entscheidung:**
Als plattformübergreifendes Entwicklungsframework wurde Kotlin Multiplatform (KMP) in Kombination mit Compose Multiplatform ausgewählt (anstelle von Alternativen wie React Native oder Flutter).

**Begründung:**
*   **Vorwissen & Effizienz:** Die primäre Entscheidung basierte auf der tiefergehenden Expertise des Entwicklers in Kotlin und KMP im Vergleich zu React Native. Dies beschleunigte den Entwicklungsprozess erheblich.
*   **Lokale Builds:** Der Build-Prozess von APK-Dateien für das direkte Testen auf physischen Android-Geräten kann unkompliziert und schnell lokal durchgeführt werden.
*   **Performance & natives Gefühl:** KMP ermöglicht es, Geschäftslogik auf sehr performante Weise zu teilen und dennoch ein sehr natives App-Erlebnis anzubieten.

## 4. Kartendienst: OpenStreetMap (OSM)

**Entscheidung:**
Für die Darstellung der digitalen Dorfkarte in der App wird OpenStreetMap und nicht auf proprietäre Dienste wie Google Maps oder Apple Maps gesetzt.

**Begründung:**
*   **Open Source & Unabhängigkeit:** Da OSM Open Source ist, entsteht keine Abhängigkeit ("Vendor Lock-in") von großen Tech-Konzernen (Big Tech).
*   **Datenschutz:** Deutlich bessere Kompatibilität mit hohen Datenschutzanforderungen, da keine unnötigen oder versteckten Trackings durch die großen Plattformen erfolgen.
*   **Kostenfaktor:** Die Einbindung und Nutzung der Karten ist frei von API-Kosten, was für das Projektbudget und eine mögliche Skalierung essenziell ist.

## 5. MQTT-Workaround

**Entscheidung:**
Bei der Übertragung von Echtzeit-Sensordaten musste die eigentlich geplante MQTT-Anbindung vorerst durch einen HTTP-Daten-Fetch abgelöst werden.

**Begründung & Auswirkungen:**
*   **MQTT-Workaround (Port 1883 gesperrt):** Da der Standard-MQTT-Port 1883 für unseren Server im Netzwerk der DHBW nicht freigegeben wurde, ist ein direkter Aufbau einer MQTT-Verbindung zwischen App und Broker unmöglich. Die aktuelle Einbindung erfolgt daher rein temporär über einen HTTP-Daten-Fetch: Die App ruft in regelmäßigen Abständen (Polling) bzw. beim Start die Daten über den Endpunkt `/api/initial-data` ab.
*   **Verweis:** Detaillierte Informationen zur Systemnutzung und den einzelnen Endpunkten sind im Dokument [App API-Anbindungen](api-anbindungen.md) aufgeführt.

## 6. Mobilitätsdaten: Nur Daten zu Züben

**Entscheidung:**
Die App zeigt ausschließlich Daten zu Zügen an, keine Informationen zu Bussen, Trams oder U-Bahnen. Außerdem ist der Routing-Teil bislang ohne Funktion.

**Begründung:**
*   **Datenverfügbarkeit:** Es wurde keine zuverlässige, öffentliche API gefunden, mit welchen man Abfahrten aller öffentlichen Verkehrsmittel (inklusive Busse) in Echtzeit abrufen könnte. Gleiches gilt für das Routing.
*   **In Betracht gezogene APIs:** [transport.rest](https://v6.db.transport.rest) gratis aber wenig zuverlässig und kleine Rate-Limits, [Delfi-API](https://www.delfi.de/de/leistungen-produkte/daten-dienste), [Mobidata-BW](https://mobidata-bw.de/dataset/trias), [Transitous-API](https://transitous.org/api), [RIS::Journeys](https://developers.deutschebahn.com/db-api-marketplace/apis/product/ris-journeys-netz) alle entweder kostenpflichtig oder nur auf Anfrage verfügbar.
*   **Keine GTFS-Daten:** Es gibt zwar öffentlich verfügbare GTFS-Datensätze für zum Beispiel das Land Baden-Württemberg, welche die planmäßigen Fahrplandaten enthalten. Diese sind jedoch statisch und bieten keine Echtzeit-Informationen zu Verspätungen, Zugausfällen oder aktuellen Abfahrtszeiten. Ohne Echtzeit-Updates wäre die Funktionalität für die Nutzer wenig hilfreich. Außerdem wäre die Implementierung dieser in das Backend zu aufwendig gewesen.
*   **Fokus auf Züge:** Da die Deutsche Bahn die [Timetables-API](https://developers.deutschebahn.com/db-api-marketplace/apis/product/timetables) als eine zuverlässige API, die auch gratis ist, mit Echtzeitdaten für Zugabfahrten bereitstellt, wurde beschlossen, sich vorerst auf diese zu konzentrieren. So können zumindest die wichtigsten Informationen zum ÖPNV (Zugverbindungen) bereitgestellt werden, auch wenn die vollständige Mobilitätsintegration (inklusive Busse) noch nicht realisiert werden konnte.
