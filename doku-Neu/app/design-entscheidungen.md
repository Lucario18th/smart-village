# Designentscheidungen der Smart Village App

Dieses Dokument hält die zentralen architektonischen und konzeptionellen Designentscheidungen für die App fest. Es baut auf den Grundlagen aus dem Dokument ["Entwicklungskonzepte für die App" (aus dem 5. Semester)](../abgabe-semester-5/Entwicklungskonzepte%20für%20die%20App.pdf) auf und spezifiziert die weitere Umsetzung.

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
