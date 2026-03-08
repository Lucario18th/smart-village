# Sicherheitskonzept

## Überblick

Dieses Dokument beschreibt die Sicherheitsmaßnahmen des Smart-Village-Systems.
Es deckt die Authentifizierung, Netzwerkarchitektur und Deployment-Sicherheit ab.

## Authentifizierung und Autorisierung

### JWT-Token

Geschützte Endpunkte erfordern einen JWT-Token.
Der Token wird bei der Anmeldung generiert und im Frontend im LocalStorage gespeichert.

**Konfiguration:**
- `JWT_SECRET` – Geheimnis für die Token-Signierung (muss im Produktionsbetrieb ein sicherer, zufälliger Wert sein)
- Token-Gültigkeit: Konfigurierbar (Standard im Code: 7 Tage)

**Anmerkung:** Die Speicherung von Tokens im LocalStorage ist anfällig für XSS-Angriffe. Für einen erhöhten Sicherheitsbedarf sollte die Speicherung in HTTP-Only-Cookies erwogen werden.

### Passwort-Sicherheit

Passwörter werden mit bcrypt gehasht, bevor sie in der Datenbank gespeichert werden.
bcrypt verwendet einen Salt und ist speziell für das Hashen von Passwörtern konzipiert.

### Rollenbasierte Zugriffskontrolle

Es gibt zwei Ebenen der Zugriffskontrolle:
- **JwtAuthGuard:** Prüft, ob ein gültiger Token vorhanden ist.
- **AdminGuard:** Prüft zusätzlich, ob der Benutzer Administrator ist (`isAdmin: true`).

Aktuell gibt es keine feinere Rechtesteuerung (z. B. pro Gemeinde).
Jeder angemeldete Benutzer kann grundsätzlich auf die Endpunkte zugreifen, die nur JwtAuthGuard erfordern.

## Netzwerkarchitektur

### Internes und externes Netz

Das Konzept sieht eine Trennung zwischen internem und externem Netz vor:

**Internes Netz (Admin-System):**
- Zugriff auf die vollständige Datenbank
- Verwaltung über das Web-Dashboard
- Zugriff nur über VPN möglich (geplant)

**Externes Netz (öffentliche Daten):**
- Nur aggregierte und öffentliche Daten
- Kein direkter Datenbankzugriff
- Für die mobile Anwendung gedacht (nicht in dieser Dokumentation behandelt)

**Anmerkung:** In der aktuellen Implementierung läuft das gesamte System in einem Docker-Netzwerk. Die Trennung in internes und externes Netz ist als Konzept dokumentiert, aber nicht vollständig umgesetzt.

### SSL/TLS

Die HTTPS-Verschlüsselung wird über Nginx abgewickelt.
In der Entwicklungsumgebung werden selbstsignierte Zertifikate verwendet.
Für den Produktionsbetrieb sollten gültige Zertifikate eingesetzt werden.

HTTP-Anfragen auf Port 80 werden automatisch auf HTTPS (Port 443) umgeleitet.

### Firewall

Für den Produktionsbetrieb wird empfohlen, nur die folgenden Ports von außen erreichbar zu machen:
- Port 443 (HTTPS) – für das Web-Dashboard
- Port 1883 (MQTT) – für IoT-Geräte (falls nötig)

Alle anderen Ports (Datenbank, MailHog, Backend direkt) sollten nur intern erreichbar sein.

## MQTT-Sicherheit

In der aktuellen Konfiguration erlaubt der Mosquitto-Broker anonymen Zugriff.
Für den Produktionsbetrieb sollte Folgendes konfiguriert werden:

- Benutzername und Passwort für MQTT-Verbindungen
- TLS-Verschlüsselung für MQTT-Kommunikation
- Access Control Lists (ACL) für Topic-basierte Berechtigung

Die Umgebungsvariablen `MQTT_USERNAME` und `MQTT_PASSWORD` sind bereits vorbereitet, aber standardmäßig leer.

## Validierung

Das Backend verwendet `class-validator` für die Eingabevalidierung.
Alle eingehenden Daten werden gegen DTOs (Data Transfer Objects) geprüft.
Die globale ValidationPipe ist so konfiguriert, dass:
- Unbekannte Felder entfernt werden (`whitelist: true`)
- Eingaben automatisch in die erwarteten Typen konvertiert werden (`transform: true`)

## VPN-Konzept

Für den Zugriff auf das Admin-System von außen ist ein VPN geplant.
Nur autorisierte Benutzer mit VPN-Zugang sollen das Dashboard erreichen können.

**Geplante Konfiguration:**
- VPN-Protokoll und Server (noch nicht festgelegt)
- Zertifikatsbasierte Authentifizierung
- Zugriffskontrolle über Benutzergruppen

**Status:** Das VPN-Konzept ist als Vorlage dokumentiert (`doku/VPN-info vorlage.md`), aber noch nicht implementiert.

## Empfehlungen für den Produktionsbetrieb

1. **JWT_SECRET:** Auf einen sicheren, zufälligen Wert setzen (mindestens 32 Zeichen).
2. **Datenbankpasswort:** Von `CHANGEME_POSTGRES_PASSWORD` auf ein sicheres Passwort ändern.
3. **SSL-Zertifikate:** Gültige Zertifikate verwenden (z. B. Let's Encrypt).
4. **MQTT-Authentifizierung:** Anonymen Zugriff deaktivieren.
5. **MailHog ersetzen:** Einen echten SMTP-Server für E-Mails konfigurieren.
6. **Firewall:** Nur benötigte Ports nach außen freigeben.
7. **VPN:** Für den Admin-Zugriff von außen ein VPN einrichten.
8. **Backups:** Regelmäßige Datenbankbackups einrichten.
9. **Rate Limiting:** Schutz vor Brute-Force-Angriffen implementieren (aktuell noch nicht vorhanden).
10. **CORS:** Die `FRONTEND_URL` auf die tatsächliche Domain setzen.

## Bekannte Einschränkungen

- Rate Limiting ist dokumentiert, aber noch nicht implementiert.
- Token-Speicherung im LocalStorage ist nicht ideal für sicherheitskritische Anwendungen.
- Keine feinere Zugriffskontrolle pro Gemeinde (jeder angemeldete Benutzer kann auf alle Endpunkte zugreifen).
- MQTT-Broker ist ohne Authentifizierung konfiguriert.
- Kein automatisches Token-Refresh implementiert.
