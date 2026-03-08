# Registrierung und Login

## Überblick

Dieser Abschnitt beschreibt den vollständigen Ablauf von der Registrierung eines neuen Kontos bis zur erfolgreichen Anmeldung.
Der Prozess umfasst drei Schritte: Registrierung, E-Mail-Verifizierung und Login.

## Registrierung

### Wann und warum wird dieser Prozess genutzt?

Die Registrierung wird einmalig pro Gemeinde durchgeführt.
Ein Gemeindeverantwortlicher erstellt ein Konto, um seine Gemeinde im System verwalten zu können.

### Ablauf Schritt für Schritt

1. Der Benutzer öffnet das Frontend im Browser und klickt auf "Registrieren".
2. Die RegisterView-Komponente wird angezeigt.
3. Der Benutzer gibt folgende Daten ein:
   - E-Mail-Adresse
   - Passwort
   - Name der Gemeinde
   - Standort (über die PLZ-Autovervollständigung)
4. Die LocationAutocomplete-Komponente ruft `GET /api/locations/search?query=<eingabe>` auf, um passende Postleitzahlen anzuzeigen.
5. Der Benutzer wählt einen Standort aus.
6. Das Frontend sendet die Daten an `POST /api/auth/register`:
   ```json
   {
     "email": "benutzer@gemeinde.de",
     "password": "sicheresPasswort",
     "postalCodeId": 42,
     "villageName": "Musterdorf"
   }
   ```
7. Das Backend (AuthService) prüft, ob die E-Mail bereits registriert ist.
8. Das Passwort wird mit bcrypt gehasht.
9. Ein Account und eine Village werden in einer Transaktion erstellt.
10. Ein 6-stelliger Verifizierungscode wird generiert (Gültigkeit: 5 Minuten).
11. Der Code wird per E-Mail verschickt (EmailService über Nodemailer).
12. Das Frontend wechselt zur EmailVerificationPending-Ansicht.

### Beteiligte Komponenten

- Frontend: RegisterView, LocationAutocomplete
- Backend: AuthController, AuthService, EmailService
- Datenbank: Account, Village, PostalCode
- E-Mail: Nodemailer → SMTP (MailHog in der Entwicklung)

## E-Mail-Verifizierung

### Wann und warum wird dieser Prozess genutzt?

Die E-Mail-Verifizierung stellt sicher, dass der Benutzer Zugang zu der angegebenen E-Mail-Adresse hat.
Ohne Verifizierung ist keine Anmeldung möglich.

### Ablauf Schritt für Schritt

1. Die EmailVerificationPending-Komponente wird angezeigt.
2. Ein Countdown von 5 Minuten zeigt die verbleibende Gültigkeitsdauer.
3. Der Benutzer ruft seine E-Mails ab (in der Entwicklung: MailHog unter `http://localhost:8025`).
4. Er gibt den 6-stelligen Code im Formular ein.
5. Das Frontend sendet den Code an `POST /api/auth/verify-code`:
   ```json
   {
     "email": "benutzer@gemeinde.de",
     "code": "123456"
   }
   ```
6. Das Backend prüft den Code gegen die Datenbank.
7. Es wird geprüft, ob der Code noch gültig ist (nicht abgelaufen).
8. Bei Erfolg wird `emailVerified` auf `true` gesetzt.
9. Der Verifizierungscode wird aus der Datenbank entfernt.
10. Das Frontend wechselt zur EmailVerifiedView-Ansicht.

### Erneutes Senden des Codes

Wenn der Code abgelaufen ist, kann der Benutzer einen neuen Code anfordern:

1. Der Benutzer klickt auf "Code erneut senden".
2. Das Frontend ruft `POST /api/auth/resend-verification` auf:
   ```json
   { "email": "benutzer@gemeinde.de" }
   ```
3. Das Backend generiert einen neuen 6-stelligen Code.
4. Der alte Code wird überschrieben.
5. Der neue Code wird per E-Mail verschickt.
6. Der Countdown wird zurückgesetzt.

### Fehlerbehandlung

- Falscher Code: Der Benutzer wird aufgefordert, den Code erneut einzugeben.
- Abgelaufener Code: Der Benutzer muss einen neuen Code anfordern.
- Mehrfache Fehleingaben: Es gibt keine Sperrung. Der Code bleibt bis zum Ablauf gültig.

## Login

### Wann und warum wird dieser Prozess genutzt?

Der Login wird bei jedem Zugriff auf das Dashboard durchgeführt.
Nach erfolgreicher Anmeldung kann der Benutzer seine Gemeinde verwalten.

### Ablauf Schritt für Schritt

1. Der Benutzer öffnet das Frontend im Browser.
2. Die LoginView-Komponente wird angezeigt.
3. Der Benutzer gibt E-Mail und Passwort ein.
4. Das Frontend ruft den Hook `useAdminAuth.login(email, password)` auf.
5. Der Hook ruft `validateCredentials(email, password)` in `session.js` auf.
6. `session.js` sendet die Daten an `POST /api/auth/login`:
   ```json
   {
     "email": "benutzer@gemeinde.de",
     "password": "sicheresPasswort"
   }
   ```
7. Das Backend (AuthService) sucht den Account anhand der E-Mail.
8. Es wird geprüft, ob die E-Mail verifiziert ist.
9. Das Passwort wird mit bcrypt gegen den Hash verglichen.
10. Bei Erfolg wird ein JWT-Token generiert (Payload: `sub`, `email`, `isAdmin`).
11. Das Backend gibt den Token und Benutzerdaten zurück.
12. Das Frontend dekodiert den Token, um die Account-ID (`sub`) zu extrahieren.
13. Die Session wird im LocalStorage gespeichert:
    - `smart-village-admin-session`: Session-Daten
    - `smart-village-admin-token`: JWT-Token
14. Das Frontend wechselt zur AdminView.
15. Der Hook `useVillageConfig` lädt die Gemeindedaten über `GET /api/villages/:villageId`.

### Automatische Wiederanmeldung

Beim Start der Anwendung prüft der Hook `useAdminAuth`, ob eine gültige Session im LocalStorage vorhanden ist.
Wenn ja, wird die Session automatisch wiederhergestellt, ohne dass der Benutzer sich erneut anmelden muss.
Der Token wird dabei nicht gegen das Backend validiert.
Erst beim nächsten API-Aufruf wird geprüft, ob der Token noch gültig ist.

### Fehlerbehandlung

| Fehler | HTTP-Code | Benutzeranzeige |
|--------|-----------|-----------------|
| E-Mail nicht gefunden | 401 | "Benutzer nicht gefunden" |
| Falsches Passwort | 401 | "Falsches Passwort" |
| E-Mail nicht verifiziert | 401 | "E-Mail nicht verifiziert" |

Bei einem Verifizierungsfehler wird die EmailVerificationPending-Ansicht angezeigt, damit der Benutzer die Verifizierung abschließen kann.

## Abmeldung

1. Der Benutzer klickt auf "Abmelden" im Dashboard.
2. Der Hook `useAdminAuth.logout()` wird aufgerufen.
3. Die Session und der Token werden aus dem LocalStorage gelöscht.
4. Das Frontend wechselt zur LoginView.

### Beispiel: Vollständiger Ablauf

Ein Gemeindeverantwortlicher aus Freiburg möchte seine Gemeinde registrieren:

1. Er öffnet `https://localhost` im Browser.
2. Er klickt auf "Registrieren".
3. Er gibt seine E-Mail `info@freiburg.de`, ein Passwort und den Gemeindenamen "Freiburg" ein.
4. Er tippt "79100" in die Standortsuche und wählt "Freiburg im Breisgau" aus.
5. Er klickt auf "Registrieren".
6. Das System zeigt die Verifizierungsseite an.
7. Er öffnet MailHog unter `http://localhost:8025` und findet die E-Mail mit dem Code "847291".
8. Er gibt den Code ein und klickt auf "Verifizieren".
9. Das System zeigt eine Bestätigung an.
10. Er klickt auf "Zum Login".
11. Er gibt seine E-Mail und sein Passwort ein und klickt auf "Anmelden".
12. Das Dashboard wird geladen und zeigt die Gemeinde "Freiburg" mit einer leeren Karte an.
