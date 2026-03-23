# Raspberry Pi 5 – Umwelt- & Bodenfeuchte-Sensor Setup

Diese Dokumentation beschreibt das aktuelle Setup auf dem Raspberry Pi 5 für Umwelt‑ und Bodenfeuchtemessung (BMP280 + YL‑69/LM393) inkl. Login‑Daten, Verzeichnisstruktur, Python‑Virtualenv und verwendeter Skripte. Sie ist so aufgebaut, dass andere Teammitglieder das Setup leicht nachbauen können.

> Hinweis: Zugangsdaten in diesem Dokument sind Beispielwerte. Vor einem öffentlichen Push nach GitHub unbedingt anpassen oder entfernen.

---

## 1. Systemübersicht

- Hardware
  - Raspberry Pi 5 mit Raspberry Pi OS (Bookworm)
  - BMP280‑Sensor (Temperatur, Luftdruck)
  - YL‑69 Bodenfeuchtesensor mit LM393 „Flying Fish“ Auswertemodul (digitaler Ausgang D0)
- Software
  - Python 3 (Bookworm‑Standard)
  - Projekt‑Virtualenv im Home‑Verzeichnis des Users `admin`
  - Diverse Python‑Skripte zum Auslesen der Sensoren und MQTT‑Versand

---

## 2. Zugangsdaten & Login

### 2.1 SSH / Lokaler Login

- Host (Beispiel): `raspberrypi.local` oder IP des Geräts
- Benutzer:
  - User: `admin`
  - Passwort: `User123`

SSH‑Beispiel:

```bash
ssh admin@raspberrypi.local
# Passwort: User123
```

### 2.2 Root‑Zugriff

Bei Bedarf:

```bash
sudo -i
# oder einzelne Befehle mit sudo:
sudo <befehl>
```

---

## 3. Projektstruktur

Alle relevanten Dateien liegen im Verzeichnis:

```text
/home/admin/Dokumente/i2c_sensor/
```

Aktuell wichtige Dateien und Ordner:

- `.venv/`  
  Python‑Virtualenv des Projekts (alle Python‑Abhängigkeiten für das Projekt).
- `bmp280_test.py`  
  Testscript für den BMP280 (Temperatur, Luftdruck, berechnete Höhe).
- `soil_info.py`  
  Script zum Auslesen des Bodenfeuchte‑Sensors (digital, „trocken/feucht“).
- `soil_mqtt.py`  
  Script, das den Bodenfeuchte‑Status über MQTT publiziert (digital, als 0/100 % Skala; anpassbar auf echte Prozentwerte mit ADC).
- weitere Dateien können ergänzt werden (z. B. CSV‑Logger, Service‑Unit‑Files).

---

## 4. Python‑Virtualenv

### 4.1 Anlegen

Im Projektverzeichnis:

```bash
cd /home/admin/Dokumente/i2c_sensor
python3 -m venv --system-site-packages .venv
```

- `.venv` ist das lokale Virtualenv‑Verzeichnis.
- `--system-site-packages` sorgt dafür, dass systemweit installierte Python‑Pakete (z. B. `gpiozero`) innerhalb der venv nutzbar sind.

### 4.2 Aktivieren / Deaktivieren

Aktivieren:

```bash
cd /home/admin/Dokumente/i2c_sensor
source .venv/bin/activate
```

Der Prompt sollte dann in etwa so aussehen:

```text
(.venv) admin@raspberrypi:~/Dokumente/i2c_sensor $
```

Deaktivieren:

```bash
deactivate
```

---

## 5. Python‑Abhängigkeiten

Alle folgenden Befehle werden in der aktivierten venv ausgeführt:

```bash
cd /home/admin/Dokumente/i2c_sensor
source .venv/bin/activate
```

### 5.1 Sensorbibliotheken

BMP280 + Blinka:

```bash
pip install adafruit-blinka
pip install adafruit-circuitpython-bmp280
```

YL‑69 / GPIO:

```bash
pip install gpiozero
```

MQTT‑Client:

```bash
pip install paho-mqtt
```

Optional können Bibliotheken wie `python3-gpiozero` auch systemweit via `apt` installiert werden; durch `--system-site-packages` sind sie in der venv verfügbar:

```bash
sudo apt update
sudo apt install -y python3-gpiozero
```

---

## 6. Hardware‑Setup

### 6.1 Raspberry Pi GPIO‑Header

Es wird der 40‑Pin‑Header des Raspberry Pi genutzt. Die physikalischen Pin‑Nummern entsprechen gängigen Pinout‑Diagrammen (z. B. „IT’S FOSS“ oder pinout.xyz).

### 6.2 BMP280 (I²C, Adresse 0x76)

Verkabelung:

- BMP280 VCC → Pin 1 (3,3 V)
- BMP280 GND → Pin 9 (GND)
- BMP280 SCL → Pin 5 (GPIO3 / SCL1)
- BMP280 SDA → Pin 3 (GPIO2 / SDA1)

I²C muss aktiviert sein:

```bash
sudo raspi-config
# Interface Options -> I2C -> Enable
sudo reboot
```

Sensorcheck:

```bash
sudo apt install -y i2c-tools
sudo i2cdetect -y 1
# BMP280 sollte als 0x76 erscheinen
```

### 6.3 YL‑69 + LM393 (digital, D0)

Es wird der digitale Ausgang D0 genutzt (kein ADC nötig, nur trocken/feucht).

Verkabelung:

- LM393 VCC → Pin 1 (3,3 V)
- LM393 GND → Pin 6 (GND)
- LM393 D0 → Pin 11 (GPIO17)

A0 (analog) bleibt ungenutzt, solange kein externer ADC (z. B. MCP3008) angeschlossen ist.

---

## 7. BMP280‑Testscript

Datei: `bmp280_test.py`  
Ort: `/home/admin/Dokumente/i2c_sensor/bmp280_test.py`

Beispielinhalt:

```python
#!/usr/bin/env python3
import time
import board
import adafruit_bmp280

i2c = board.I2C()  # nutzt SCL/SDA über board-Modul
bmp280 = adafruit_bmp280.Adafruit_BMP280_I2C(i2c, address=0x76)

# optional: Luftdruck auf Meereshöhe anpassen
bmp280.sea_level_pressure = 1013.25

while True:
    print(f"Temp: {bmp280.temperature:.2f} °C")
    print(f"Druck: {bmp280.pressure:.2f} hPa")
    print(f"Höhe: {bmp280.altitude:.2f} m")
    time.sleep(2)
```

Aufruf (mit venv):

```bash
cd /home/admin/Dokumente/i2c_sensor
source .venv/bin/activate
python3 bmp280_test.py
```

Abbruch wie üblich mit `Strg + C`.

---

## 8. Bodenfeuchte – Digitales Info‑Script

Datei: `soil_info.py`  
Ort: `/home/admin/Dokumente/i2c_sensor/soil_info.py`

Zweck: Direkte Ausgabe des digitalen Bodenfeuchte‑Zustands (`trocken`/`feucht`) im Terminal.

Beispielinhalt:

```python
#!/usr/bin/env python3
import time
from gpiozero import DigitalInputDevice

# D0 an GPIO17 (physikalischer Pin 11)
sensor = DigitalInputDevice(17)

def interpret_value(v):
    # Typischerweise: 1 = trocken, 0 = feucht
    return "trocken" if v == 1 else "feucht"

print("Starte Bodenfeuchte-Messung (YL-69 + LM393, digital)")
print("D0 an GPIO17, Schwelle per Potentiometer am Modul einstellbar.\n")

try:
    while True:
        raw = sensor.value  # 0 oder 1
        zustand = interpret_value(raw)

        print("Rohwert (digital):", raw)
        print("Interpretation: Boden ist", zustand)
        print("Hinweis: Schwelle am blauen Poti auf dem Modul einstellbar.")
        print("-" * 40)

        time.sleep(2)

except KeyboardInterrupt:
    print("\nMessung abgebrochen.")
```

Ausführung:

```bash
cd /home/admin/Dokumente/i2c_sensor
source .venv/bin/activate
chmod +x soil_info.py
python3 soil_info.py
```

---

## 9. Bodenfeuchte → MQTT (digital, skaliert)

Datei: `soil_mqtt.py`  
Ort: `/home/admin/Dokumente/i2c_sensor/soil_mqtt.py`

Zweck: Bodenfeuchte‑Status des YL‑69/LM393 wird regelmäßig als MQTT‑Payload im Schema des bestehenden Simulators gesendet.

### 9.1 Konfiguration (Umgebungsvariablen)

- `MQTT_URL` – z. B. `mqtt://localhost:1883`
- `ACCOUNT_ID` – Konto‑ID, z. B. `1`
- `VILLAGE` – `freiburg`, `loerrach` oder `buggingen` (oder eigenen Wert wählen)
- `DEVICE_ID` – ID des Gateways, z. B. `gw-loerrach-1`
- `SENSOR_ID` – eindeutige Sensor‑ID (z. B. `71001`)
- `PUBLISH_INTERVAL` – Sendeintervall in Sekunden (Standard: 10)

Beispielstart:

```bash
cd /home/admin/Dokumente/i2c_sensor
source .venv/bin/activate

MQTT_URL="mqtt://192.168.1.10:1883" \
ACCOUNT_ID=1 \
VILLAGE=loerrach \
DEVICE_ID=gw-loerrach-1 \
SENSOR_ID=71001 \
PUBLISH_INTERVAL=10 \
python3 soil_mqtt.py
```

### 9.2 Verhalten

- Der digitale Wert von D0 wird gelesen (`0` oder `1`).
- Daraus wird eine einfache Skala abgeleitet:
  - `1 → 0 %` (Boden trocken)
  - `0 → 100 %` (Boden feucht)
- Es wird ein JSON‑Payload entsprechend der simulierten `SensorPayload`‑Struktur an den Broker publiziert.
- Zusätzlich wird eine Discovery‑Nachricht (`config`‑Topic) gesendet, damit die Sensor‑Definition dem bestehenden System bekannt ist.

Eine spätere Erweiterung auf einen echten ADC (z. B. MCP3008) mit Kalibrierung auf 0–100 % ist vorgesehen, aber nicht Teil dieses Grund‑Setups.

---

## 10. Typische Workflows

### 10.1 Nach Reboot weitermachen

```bash
ssh admin@raspberrypi.local
cd /home/admin/Dokumente/i2c_sensor
source .venv/bin/activate
python3 bmp280_test.py         # oder soil_info.py / soil_mqtt.py
```

### 10.2 Neue Skripte hinzufügen

1. Datei im Projektordner anlegen (z. B. `my_script.py`).
2. In Git hinzufügen / commiten:

```bash
cd /home/admin/Dokumente/i2c_sensor
git add my_script.py
git commit -m "Add my_script for XYZ"
git push
```

---

## 11. ToDo / Erweiterungen

- ADC (z. B. MCP3008 oder ADS1115) hinzufügen, um echte Bodenfeuchte‑Prozentwerte aus A0 zu messen.
- Systemd‑Service für `soil_mqtt.py` und ggf. `bmp280`‑Auswertung einrichten.
- Logging der Messwerte in CSV/SQLite sowie Einbindung in bestehende Monitoring‑/Dashboard‑Umgebung.
