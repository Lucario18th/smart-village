# VPN-Zugang – Smart Village (internes System)

> **Hinweis:** Diese Seite ist nur für berechtigte Administratoren bestimmt. Zugangsdaten dürfen nicht an Dritte weitergegeben werden.

---

## 1. Zweck des VPN-Zugangs

- Sicherer Zugriff auf:
  - internes Admin-Backend
  - interne Datenbank
  - Monitoring- und Log-Systeme
- Nur für:
  - Projektteam
  - autorisierte Administratoren / Betreuer

---

## 2. Technische VPN-Daten

- VPN-Typ / Protokoll: `...` (z.B. OpenVPN, WireGuard, IPsec)
- Server-Adresse / Hostname: `...`
- Port: `...`
- Verschlüsselung / Cipher (optional): `...`
- Authentifizierungsart:
  - `...` (z.B. Zertifikat + Benutzername/Passwort)

---

## 3. Zugangsdaten & Berechtigungen

> **Wichtig:** Keine Passwörter im Klartext in dieser Doku speichern.  
> Zugangsdaten werden getrennt verwaltet (z.B. Passwortmanager, verschlüsselte Datei).

- Benutzerrollen:
  - **Admin:** Vollzugriff auf Backend, DB, Logs  
  - **Read-Only:** Nur lesender Zugriff auf Dashboards
- Ausgabe der VPN-Zugangsdaten:
  - Verantwortliche Person: `...`
  - Ausgabeprozess (z.B. persönliche Übergabe / verschlüsselte Mail): `...`

---

## 4. Client-Konfiguration

### 4.1 Unterstützte Betriebssysteme

- Windows: `...` (z.B. OpenVPN GUI, WireGuard Client)
- Linux: `...`
- macOS: `...`

### 4.2 Installationsschritte (Beispiel, anpassen)

1. VPN-Client installieren: `...`  
2. Konfigurationsdatei (`.ovpn` / `.conf`) von `...` beziehen  
3. Konfiguration im Client importieren  
4. Mit Benutzername/Passwort bzw. Schlüssel verbinden  

---

## 5. Zugriff auf interne Dienste (nach VPN-Verbindung)

- Admin-Weboberfläche:
  - URL: `http://<interne-ip-oder-hostname>:8000`  
- Datenbank (nur für Admins):
  - Host: `<interne-ip-oder-hostname>`
  - Port: `5432`
  - DB-Name: `smartvillage`
- Monitoring/Logs (falls vorhanden):
  - URL: `http://<interne-ip-oder-hostname>:<port>`

---

## 6. Sicherheit & Richtlinien

- Zugang nur persönlich nutzen, keine Weitergabe von Zugangsdaten.
- VPN-Zugang nur für Projekt- und Administrationszwecke verwenden.
- Bei Verlust/Leak von Zugangsdaten:
  - Sofort melden an: `...`
  - Zugang wird gesperrt / erneuert.

---

## 7. Support / Kontakt

- Technischer Ansprechpartner VPN:
  - Name: `...`
  - E-Mail: `...`
- Allgemeine Fragen zum Projekt:
  - Name: `...`
  - E-Mail: `...`
