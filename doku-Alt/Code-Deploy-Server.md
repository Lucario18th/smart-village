# Smart Village – Deployment auf dem DHBW‑Server

## Ziel

Diese Anleitung beschreibt, wie die Smart‑Village‑Website auf dem DHBW‑Server gebaut und über Nginx ausgeliefert wird.  
Genutzt wird das GitHub‑Repo:

- `https://github.com/Lucario18th/smart-village.git`
- Website‑Code liegt im Unterordner `website/`.

---

## Voraussetzungen

- SSH‑Zugriff auf den Server `192.168.23.113` als User `student`
- Git, Node.js, npm installiert
- Nginx installiert und aktiv

Nginx und Git installieren (falls noch nicht vorhanden):

sudo apt update
sudo apt install nginx git -y
1. Repository auf dem Server
1.1 Erstes Klonen (nur einmal nötig)
bash
cd ~
git clone https://github.com/Lucario18th/smart-village.git
Danach liegt das Repo unter:

text
~/smart-village
1.2 Branch holen / wechseln
Wenn ein bestimmter Branch (z.B. setup-website oder später main) deployed werden soll:

bash
cd ~/smart-village
git fetch
git checkout <BRANCHNAME>   # z.B. setup-website oder main
git pull
2. Frontend builden (Vite/Node)
Der Website‑Code liegt in ~/smart-village/website.
Der Build wird immer dort ausgeführt, nicht direkt in /var/www.

bash
cd ~/smart-village/website
Bei Problemen/Versionswechseln vorher aufräumen:

bash
rm -rf node_modules package-lock.json
Anschließend Dependencies installieren und Build erzeugen:

bash
npm install
npm run build
Ergebnis:

Der fertige Build liegt im Ordner:

text
~/smart-village/website/dist
Dieser Ordner enthält die statischen Dateien (HTML, JS, CSS), die Nginx ausliefern soll.

3. Build nach /var/www deployen
Webroot für die Website:

text
/var/www/smart-village/html
3.1 Webroot anlegen (nur beim ersten Mal)
bash
sudo mkdir -p /var/www/smart-village/html
3.2 Alten Stand löschen und neuen Build kopieren
bash
# alten Inhalt entfernen
sudo rm -rf /var/www/smart-village/html/*

# neuen Build aus dist kopieren
sudo cp -r ~/smart-village/website/dist/* /var/www/smart-village/html/

# Rechte für Nginx setzen
sudo chown -R www-data:www-data /var/www/smart-village/html
Ab jetzt liegen nur die fertigen Build‑Dateien im Webroot.

4. Nginx konfigurieren
Ziel: Nginx soll die Dateien aus /var/www/smart-village/html unter Port 80 ausliefern.

4.1 Server‑Block anlegen/bearbeiten
Datei:

text
/etc/nginx/sites-available/smart-village
Inhalt:

text
server {
    listen 80;
    server_name _;

    root /var/www/smart-village/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
Erläuterung:

root zeigt auf das Webroot mit dem Build.

try_files ... /index.html; sorgt dafür, dass SPA‑Routen (React/Vite) auf index.html zurückfallen.

4.2 Site aktivieren (nur einmal nötig)
bash
# Site aktivieren
sudo ln -s /etc/nginx/sites-available/smart-village /etc/nginx/sites-enabled/smart-village

# Default-Site entfernen
sudo rm /etc/nginx/sites-enabled/default

# Config testen
sudo nginx -t

# Nginx neu laden
sudo systemctl reload nginx
5. Funktion prüfen
5.1 Auf dem Server
bash
curl http://localhost
curl http://192.168.23.113
Beide Befehle sollten das HTML der Smart‑Village‑Website ausgeben.

5.2 Im Browser (Client)
Vom Rechner im Hochschulnetz oder mit aktivem HS‑VPN:

text
http://192.168.23.113
Hinweis: Damit das von außerhalb funktioniert, muss das Hochschul‑VPN den Zugriff auf 192.168.23.113:80 erlauben.

6. Neuen Branch / neuen Stand deployen
Wenn später ein anderer Branch (z.B. main) live gehen soll, sind die Schritte:

bash
# 1. Neuen Branch holen
cd ~/smart-village
git fetch
git checkout main
git pull

# 2. Neu builden
cd ~/smart-village/website
npm install
npm run build

# 3. Build deployen
sudo rm -rf /var/www/smart-village/html/*
sudo cp -r dist/* /var/www/smart-village/html/
sudo chown -R www-data:www-data /var/www/smart-village/html

# 4. Nginx neu laden (falls nötig)
sudo systemctl reload nginx
Danach zeigt http://192.168.23.113 den neuen Stand des gewählten Branches.

text
undefined
