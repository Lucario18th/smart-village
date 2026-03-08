# Tagesdokumentation – 24.02.2026  
## Thema: Test‑ und Deployment‑Infrastruktur „Smart Village“

## 1. Zielsetzung

- Aufbau einer realistischen, sicheren Server‑Infrastruktur für das Smart‑Village‑Projekt.  
- Trennung in Test‑/Staging‑Umgebung (bei mir zuhause) und Produktivumgebung (geplanter DHBW‑Server).  
- Mein Schwerpunkt: Server‑Setup, Deployment‑Strategie und Sicherheitskonzept (SSH, VPN, Firewall).

---

## 2. Testumgebung: Home‑Server mit Proxmox

- Proxmox als Basis (Bare‑Metal‑Hypervisor) auf einem Heim‑Server installiert.  
- Anlegen einer dedizierten Ubuntu‑Webserver‑VM:  
  - Zuweisung von **2 vCPUs**.  
  - Zuweisung von **4 GB RAM**.  
- Einrichtung der Web‑VM:  
  - Installation von Ubuntu Server.  
  - Installation und Grundkonfiguration von **Nginx** als Webserver/Reverse Proxy.  
  - Klonen des gemeinsamen GitHub‑Repositories `smart-village` auf die VM (aktueller Projektstand liegt lokal vor).  

**Rolle dieser VM:**  
- Dient als **Test‑ und Staging‑Server** für neue Features.  
- Neue Funktionen werden hier realitätsnah geprüft, bevor ein Deployment auf den späteren DHBW‑Produktivserver erfolgt.

---

## 3. Geplante Produktivumgebung: DHBW‑Server

- Geplant ist ein dedizierter Server an der DHBW als Produktivsystem.  
- Aufgaben dieses Servers:  
  - Hosting der **Smart‑Village‑Website**.  
  - Betrieb der dazugehörigen **Datenbanken** (z.B. Sensor‑, Nutzer‑ und Verwaltungsdaten).  
- Zielbild:  
  - Stabile, dauerhaft erreichbare Umgebung zur Präsentation des Projekts.  
  - Klare Trennung:  
    - Home‑Server = Staging/Test.  
    - DHBW‑Server = Produktion.

---

## 4. Deployment‑Strategie

**Grundidee:** Mehrstufiges Deployment zur Qualitätssicherung.

1. **Lokale Entwicklung**  
   - Implementierung und erster Test neuer Features lokal auf den Entwickler‑Rechnern.

2. **Pull Request Workflow**  
   - Änderungen werden per Pull Request in das zentrale GitHub‑Repository eingebracht.  
   - Optional: Code‑Review/Abnahme im Team.

3. **Staging auf meinem Home‑Server**  
   - Ich aktualisiere den Stand auf der Ubuntu‑Webserver‑VM (z.B. `git pull`).  
   - Durchführen von Builds, Tests und manuellen Funktionstests auf der Staging‑Umgebung.  
   - Ziel: Sicherstellen, dass die Anwendung auf einer serverähnlichen Umgebung stabil läuft.

4. **Merge und automatisiertes Deployment auf DHBW‑Server**  
   - Nach erfolgreichem Test werden Pull Requests gemerged.  
   - Geplante Nutzung von **GitHub Actions**, z.B.:  
     - Zu bestimmten Zeiten oder bei Änderungen im Main‑Branch.  
     - Automatisches Ausrollen der neuen Version auf den DHBW‑Produktivserver.  
     - Ausführen von Build‑Schritten und Neustart relevanter Services.  
   - Ergebnis: Der DHBW‑Server bleibt regelmäßig und reproduzierbar auf einem getesteten Stand.

---

## 5. Sicherheitskonzept

### 5.1 SSH‑Absicherung

- Sowohl mein Testserver (Ubuntu‑VM) als auch der zukünftige DHBW‑Server sollen möglichst nur noch **SSH‑Key‑Authentifizierung** nutzen.  
- Maßnahmen:  
  - Einrichten von SSH‑Keys für die relevanten Benutzer (z.B. `deploy`‑User oder Admin‑Accounts).  
  - Perspektivisch Deaktivierung von Passwort‑Logins über SSH, um Brute‑Force‑Angriffe zu erschweren.  
  - Vergabe gezielter sudo‑Rechte für den `deploy`‑User (z.B. nur für Deployments und Service‑Neustarts, nicht für vollständige Root‑Kontrolle).

### 5.2 VPN‑Konzept für produktive Dörfer

- Für reale Dorf‑Szenarien ist ein **VPN‑Zugriff** vorgesehen.  
- Idee:  
  - Der DHBW‑ bzw. spätere Dorf‑Server wird nur über ein VPN erreichbar gemacht.  
  - Nur **privilegierte Nutzer** (z.B. Gemeindemitarbeiter oder Administratoren) bekommen VPN‑Zugang.  
  - Über das VPN können Verwaltungsoberflächen, Monitoring und Steuerungsfunktionen sicher genutzt werden.  
- Vorteil:  
  - Der Server ist nicht frei im Internet exponiert.  
  - Zugriff bleibt auf definierte, berechtigte Personen beschränkt – passend zum Sicherheitsbedarf eines Dorf‑/Kommunalprojekts.

### 5.3 Firewall (UFW / iptables)

- Auf Test‑ und Produktivservern soll eine zusätzliche Absicherung durch eine **Firewall** erfolgen (z.B. UFW oder direkt iptables).  
- Geplante Grundregeln:  
  - Nur notwendige Ports öffnen (z.B. 22 für SSH, 80/443 für HTTP/HTTPS, ggf. spezifische VPN‑Ports).  
  - Standard‑Policy: alle anderen eingehenden Verbindungen blockieren (Default‑Deny‑Prinzip).  
  - Kombination aus VPN + SSH‑Keys + Firewall soll ein hohes Sicherheitsniveau für den späteren produktiven Einsatz in Dörfern gewährleisten.

---

## 6. Zusammenfassung meiner Aufgaben

- Aufbau und Konfiguration des **Proxmox‑Servers** als Basis.  
- Anlage und Konfiguration der **Ubuntu‑Webserver‑VM** (2 Kerne, 4 GB RAM).  
- Bereitstellung der Projekt‑Anwendung:  
  - Klonen und Aktualisieren des GitHub‑Repositories auf dem Testserver.  
  - Einrichtung von Nginx als Webserver/Reverse Proxy.  
- Design und Umsetzung der **Deployment‑Strategie**:  
  - Lokale Entwicklung → Staging auf meinem Home‑Server → produktives Deployment auf DHBW‑Server.  
  - Vorbereitung auf den Einsatz von GitHub Actions für automatisierte Deployments.  
- Konzeption und Vorbereitung der **Sicherheit**:  
  - SSH‑Key‑Login statt Passwort (für Test‑ und Produktivserver).  
  - Planung eines VPN‑Zugriffs für privilegierte Nutzer im Dorf‑Szenario.  
  - Nutzung einer Firewall (UFW/iptables), um nur notwendige Dienste erreichbar zu machen.

