# Admin-Modul

## Überblick

Das AdminModule stellt Funktionen bereit, die nur von Administratoren verwendet werden können.
Aktuell umfasst das Modul einen Endpunkt zum Löschen von Konten.
Die Implementierung befindet sich unter `backend/src/admin/`.

## Endpunkte

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|-------------|
| DELETE | `/api/admin/accounts/:accountId` | Ja (JWT + Admin) | Konto und alle zugehörigen Daten löschen |

## Kontolöschung

`DELETE /api/admin/accounts/:accountId` (JWT + AdminGuard erforderlich)

Löscht ein Konto vollständig mit allen zugehörigen Daten.
Nur Benutzer mit `isAdmin: true` können diesen Endpunkt verwenden.

### Kaskadierender Löschvorgang

Die Löschung erfolgt kaskadierend in einer Datenbanktransaktion.
Das bedeutet, dass entweder alle Daten gelöscht werden oder keine.

**Löschreihenfolge:**

1. Alle Messwerte (SensorReading) der Sensoren in den Gemeinden des Kontos.
2. Alle Sensor-Status (SensorStatus) der Sensoren.
3. Alle Sensoren (Sensor) in den Gemeinden.
4. Alle Nachrichten (Message) in den Gemeinden.
5. Alle Mitfahrgelegenheiten (RideShare) in den Gemeinden.
6. Alle Benutzer (User) in den Gemeinden.
7. Alle Gemeinden (Village) des Kontos.
8. Das Konto (Account) selbst.

Die Reihenfolge ist wichtig, weil Fremdschlüsselbeziehungen eingehalten werden müssen.
Prisma wickelt den gesamten Vorgang in einer Transaktion ab, sodass bei einem Fehler keine Daten teilweise gelöscht bleiben.

### Beispiel

Ein Administrator möchte das Konto mit der ID 5 löschen:

```
DELETE /api/admin/accounts/5
Authorization: Bearer <admin-jwt-token>
```

Das System findet alle Gemeinden, die zu Account 5 gehören.
Für jede Gemeinde werden zunächst alle untergeordneten Daten gelöscht.
Am Ende wird der Account selbst entfernt.

### Fehlerbehandlung

- 404 Not Found: Das Konto mit der angegebenen ID existiert nicht.
- 403 Forbidden: Der anfragende Benutzer ist kein Administrator.
- 401 Unauthorized: Kein gültiger JWT-Token.

## Entwurfsentscheidung

Die kaskadierende Löschung ist explizit im Code implementiert, statt die `onDelete: Cascade`-Option in Prisma zu verwenden.
Vermutlich wurde dies so gelöst, um mehr Kontrolle über die Löschreihenfolge zu haben und sicherzustellen, dass alle abhängigen Daten vollständig entfernt werden.

## Frontend-Integration

Im Frontend gibt es einen `DeleteAccountDialog`, der vor dem Löschen eine Bestätigung verlangt.
Der Benutzer muss die E-Mail-Adresse des zu löschenden Kontos eingeben, um die Aktion zu bestätigen.
Der Dialog ruft den API-Client auf, der `DELETE /api/admin/accounts/:accountId` aufruft.

## Abhängigkeiten

Das AdminModule enthält:
- AdminService – Geschäftslogik für die Kontolöschung
- AdminController – HTTP-Endpunkt
- AdminGuard – Prüfung der Administratorrechte

Abhängigkeit auf PrismaService für den Datenbankzugriff.
