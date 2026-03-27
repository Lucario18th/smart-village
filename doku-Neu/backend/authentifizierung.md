# Authentifizierung und Autorisierung

## Überblick

Das Backend verwendet JWT (JSON Web Tokens) zur Authentifizierung.
Benutzer registrieren sich mit E-Mail und Passwort und erhalten nach der Anmeldung einen Token.
Dieser Token wird bei geschützten Anfragen im HTTP-Header mitgeschickt.

Die Implementierung befindet sich im Modul `backend/src/auth/`.

## Endpunkte

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| POST | `/api/auth/register` | Nein | Neues Konto und Gemeinde anlegen |
| POST | `/api/auth/login` | Nein | Anmeldung mit E-Mail und Passwort |
| POST | `/api/auth/verify-code` | Nein | E-Mail-Verifizierungscode prüfen |
| POST | `/api/auth/resend-verification` | Nein | Verifizierungscode erneut senden |
| GET | `/api/auth/me` | Ja (JWT) | Eigenes Konto und zugehörige Gemeinden abrufen |
| POST | `/api/auth/account-settings` | Ja (JWT) | Account-Typ und Public-App-API-Freigabe aktualisieren |

## Registrierung

Bei der Registrierung wird ein neues Konto angelegt.
Gleichzeitig wird automatisch eine Gemeinde für dieses Konto erstellt.

**Eingabe:**
- `email` (String, erforderlich) – E-Mail-Adresse
- `password` (String, erforderlich) – Passwort (wird mit bcrypt gehasht)
- `postalCodeId` (Int, erforderlich) – ID der Postleitzahl
- `villageName` (String, optional) – Name der Gemeinde
- `accountType` (Enum, optional) – `MUNICIPAL` oder `PRIVATE`
- `isPublicAppApiEnabled` (Boolean, optional) – darf die Gemeinde in der öffentlichen App-API erscheinen

**Ablauf:**
1. Die E-Mail wird auf Eindeutigkeit geprüft.
2. Das Passwort wird mit bcrypt gehasht.
3. Ein Account-Datensatz wird in der Datenbank angelegt.
4. Eine Village wird mit dem Account verknüpft.
5. Ein 6-stelliger Verifizierungscode wird generiert (Gültigkeit: 5 Minuten).
6. Der Code wird per E-Mail verschickt.

**Rückgabe:** Der erstellte Account (ohne Passwort-Hash).

**Defaults:**
- Ohne Angabe wird `accountType = MUNICIPAL` gesetzt.
- Ohne Angabe wird `isPublicAppApiEnabled` fuer MUNICIPAL auf `true` und fuer PRIVATE auf `false` gesetzt.

**Fehler:**
- 409 Conflict: Wenn die E-Mail bereits registriert ist.

## E-Mail-Verifizierung

Nach der Registrierung muss die E-Mail-Adresse verifiziert werden.
Ohne Verifizierung ist kein Login möglich.

**Eingabe (verify-code):**
- `email` (String) – E-Mail-Adresse
- `code` (String) – 6-stelliger Verifizierungscode

**Ablauf:**
1. Der Code wird gegen die Datenbank geprüft.
2. Es wird geprüft, ob der Code noch gültig ist (5 Minuten).
3. Bei Erfolg wird `emailVerified` auf `true` gesetzt.
4. Der Verifizierungscode wird aus der Datenbank entfernt.

**Fehler:**
- 400 Bad Request: Wenn der Code ungültig oder abgelaufen ist.

**Erneutes Senden (resend-verification):**
- Generiert einen neuen 6-stelligen Code.
- Setzt die Gültigkeitsdauer zurück (5 Minuten).
- Sendet den Code erneut per E-Mail.

## Login

**Eingabe:**
- `email` (String) – E-Mail-Adresse
- `password` (String) – Passwort

**Ablauf:**
1. Der Account wird anhand der E-Mail gesucht.
2. Es wird geprüft, ob die E-Mail verifiziert ist.
3. Das Passwort wird mit bcrypt gegen den gespeicherten Hash geprüft.
4. Bei Erfolg wird ein JWT-Token generiert.

**Rückgabe:**
```json
{
  "access_token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "email": "beispiel@test.de",
    "isAdmin": false
  }
}
```

**Token-Inhalt (Payload):**
- `sub` – Account-ID
- `email` – E-Mail-Adresse
- `isAdmin` – Administratorstatus

**Token-Gültigkeit:** Konfigurierbar über `JWT_EXPIRES_IN` (Standard: 1 Stunde in der Konfiguration, 7 Tage im Code).

**Anmerkung:** Im Code ist die Token-Gültigkeit auf 7 Tage festgelegt (`expiresIn: '7d'`), während die Umgebungsvariable `JWT_EXPIRES_IN` auf `1h` gesetzt ist. Vermutlich wird die Umgebungsvariable im Code nicht ausgelesen. Dies ist eine Inkonsistenz, die beachtet werden sollte.

**Fehler:**
- 401 Unauthorized: Wenn die E-Mail nicht gefunden wird, das Passwort falsch ist oder die E-Mail nicht verifiziert wurde.

## JWT-Authentifizierung

Geschützte Endpunkte erfordern einen gültigen JWT-Token im HTTP-Header:

```
Authorization: Bearer <token>
```

Das Backend verwendet NestJS Guards, um Endpunkte abzusichern:

**JwtAuthGuard:**
Prüft, ob ein gültiger JWT-Token vorhanden ist.
Bei Erfolg wird der dekodierte Token-Inhalt im Request-Objekt als `user` bereitgestellt.
Wird für alle Endpunkte verwendet, die eine Anmeldung erfordern (z. B. `PUT /api/villages/:id`).

**AdminGuard:**
Prüft zusätzlich, ob `isAdmin` im Token auf `true` gesetzt ist.
Wird für administrative Endpunkte verwendet (z. B. `DELETE /api/admin/accounts/:id`).

## Account-Einstellungen

Mit `POST /api/auth/account-settings` kann ein eingeloggter Account den Typ und die Freigabe fuer die öffentliche App-API anpassen.

**Eingabe:**
- `accountType` (`MUNICIPAL` | `PRIVATE`)
- `isPublicAppApiEnabled` (Boolean)

Diese Einstellungen wirken sich direkt auf die Auslieferung der öffentlichen App-API (`/api/app/...`) aus.

## E-Mail-Versand

Der E-Mail-Versand wird über den EmailService abgewickelt.
Dieser verwendet Nodemailer als SMTP-Client.

**Konfiguration:**
- `SMTP_HOST` – SMTP-Server (Standard: `smartvillage-mailhog`)
- `SMTP_PORT` – SMTP-Port (Standard: 1025)
- `SMTP_SECURE` – TLS verwenden (Standard: false)
- `SMTP_USER` / `SMTP_PASS` – Anmeldedaten (optional)
- `MAIL_FROM` – Absenderadresse

In der Entwicklungsumgebung werden E-Mails an MailHog gesendet.
MailHog stellt eine Web-Oberfläche unter `http://localhost:8025` bereit, über die empfangene E-Mails eingesehen werden können.

## Sicherheitshinweise

Passwörter werden mit bcrypt gehasht und niemals im Klartext gespeichert.
JWT-Tokens werden mit einem geheimen Schlüssel signiert, der über die Umgebungsvariable `JWT_SECRET` konfiguriert wird.
Für den Produktionsbetrieb muss ein sicherer, zufälliger Wert verwendet werden.

Das Frontend speichert den Token im LocalStorage.
Vermutlich wurde dies aus Einfachheitsgründen so umgesetzt.
Für einen erhöhten Sicherheitsbedarf wäre die Speicherung in einem HTTP-Only-Cookie eine Alternative.

## Abhängigkeiten

Das AuthModule hängt von folgenden Komponenten ab:
- PrismaService – Datenbankzugriff für Accounts
- JwtModule – Token-Erstellung
- PassportModule – Authentifizierungsstrategie
- EmailService – E-Mail-Versand (Nodemailer)
