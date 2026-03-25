#!/usr/bin/env python3
import json
import os
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

import adafruit_bmp280
import board
import paho.mqtt.client as mqtt
from gpiozero import DigitalInputDevice

# ---------- Basis-Konfiguration ----------
# Wie im run-simulator.sh: ACCOUNT_ID=1, VILLAGE_ID=1
MQTT_URL = os.getenv("MQTT_URL", "mqtt://localhost:1883")
ACCOUNT_ID = os.getenv("ACCOUNT_ID", "1")
VILLAGE_ID = int(os.getenv("VILLAGE_ID", "1"))
DEVICE_ID = os.getenv("DEVICE_ID", "pi5-v1-env-01")
PUBLISH_INTERVAL = float(os.getenv("PUBLISH_INTERVAL", "10"))

# Standort (optional)
LAT = float(os.getenv("LAT", "47.6152"))
LNG = float(os.getenv("LNG", "7.6677"))

# Sensor-IDs / Typen passend zum Simulator-Schema
SENSOR_SOIL_ID = int(os.getenv("SENSOR_SOIL_ID", "71001"))
SENSOR_TEMP_ID = int(os.getenv("SENSOR_TEMP_ID", "71002"))
SENSOR_PRESSURE_ID = int(os.getenv("SENSOR_PRESSURE_ID", "71003"))

SENSOR_TYPE_SOIL = 7
SENSOR_TYPE_TEMP = 1
SENSOR_TYPE_PRESSURE = 3

# Hardware-Setup
SOIL_GPIO = int(os.getenv("SOIL_GPIO", "17"))
BMP280_ADDR = int(os.getenv("BMP280_ADDR", "0x76"), 16)
SEA_LEVEL_PRESSURE = float(os.getenv("SEA_LEVEL_PRESSURE", "1013.25"))

# YL-69 Mapping (wie in soil_local_test.py)
DRY_PERCENT = float(os.getenv("DRY_PERCENT", "15.0"))
MOIST_PERCENT = float(os.getenv("MOIST_PERCENT", "85.0"))
SMOOTHING_ALPHA = float(os.getenv("SMOOTHING_ALPHA", "0.4"))

_last_soil_percent = None


def soil_raw_to_percent(raw: int):
    global _last_soil_percent

    if raw == 1:
        target = DRY_PERCENT
        label = "sehr trocken"
    else:
        target = MOIST_PERCENT
        label = "nass/feucht"

    if _last_soil_percent is None:
        percent = target
    else:
        percent = _last_soil_percent + SMOOTHING_ALPHA * (target - _last_soil_percent)

    _last_soil_percent = percent
    return round(percent, 1), label


def parse_mqtt_url(url: str):
    parsed = urlparse(url)
    host = parsed.hostname or "localhost"
    port = parsed.port or 1883
    username = parsed.username
    password = parsed.password
    return host, port, username, password


def build_discovery_payload():
    return {
        "villageId": VILLAGE_ID,
        "device": {
            "name": "Raspberry Pi 5 Umwelt/Boden Gateway",
            "latitude": LAT,
            "longitude": LNG,
        },
        "sensors": [
            {
                "sensorId": SENSOR_SOIL_ID,
                "sensorTypeId": SENSOR_TYPE_SOIL,
                "name": "Bodenfeuchte (digital)",
                "infoText": "YL-69/LM393 digitaler Bodenstatus",
                "latitude": LAT,
                "longitude": LNG,
            },
            {
                "sensorId": SENSOR_TEMP_ID,
                "sensorTypeId": SENSOR_TYPE_TEMP,
                "name": "Temperatur (BMP280)",
                "infoText": "BMP280 Temperatur",
                "latitude": LAT,
                "longitude": LNG,
            },
            {
                "sensorId": SENSOR_PRESSURE_ID,
                "sensorTypeId": SENSOR_TYPE_PRESSURE,
                "name": "Luftdruck (BMP280)",
                "infoText": "BMP280 Luftdruck",
                "latitude": LAT,
                "longitude": LNG,
            },
        ],
    }


def publish_sensor(client: mqtt.Client, sensor_id: int, value, unit: str, extra: dict, status: str = "OK"):
    topic = f"sv/{ACCOUNT_ID}/{DEVICE_ID}/sensors/{sensor_id}"
    payload = {
        "value": value,
        "ts": datetime.now(timezone.utc).isoformat(),
        "status": status,
        "unit": unit,
        "extra": extra,
    }
    client.publish(topic, json.dumps(payload), qos=0)
    print(f"-> {topic} value={value} unit={unit} status={status}")


def main():
    host, port, username, password = parse_mqtt_url(MQTT_URL)

    # Sensoren initialisieren
    soil_input = DigitalInputDevice(SOIL_GPIO, pull_up=False)

    i2c = board.I2C()
    bmp280 = adafruit_bmp280.Adafruit_BMP280_I2C(i2c, address=BMP280_ADDR)
    bmp280.sea_level_pressure = SEA_LEVEL_PRESSURE

    client = mqtt.Client()
    if username:
        client.username_pw_set(username, password)

    def on_connect(cli, _userdata, _flags, reason_code, _properties=None):
        print(f"Connected to MQTT {host}:{port} reason={reason_code}")
        discovery_topic = f"sv/{ACCOUNT_ID}/{DEVICE_ID}/config"
        cli.publish(discovery_topic, json.dumps(build_discovery_payload()), qos=1)
        print(f"Discovery published -> {discovery_topic} (villageId={VILLAGE_ID})")

    client.on_connect = on_connect
    client.connect(host, port, keepalive=60)
    client.loop_start()

    try:
        while True:
            # YL-69 (digital -> geglaettete Prozentanzeige)
            raw = soil_input.value
            soil_percent, soil_label = soil_raw_to_percent(raw)
            publish_sensor(
                client,
                SENSOR_SOIL_ID,
                soil_percent,
                "%",
                {
                    "source": "pi5",
                    "sensor": "YL-69/LM393",
                    "digitalRaw": int(raw),
                    "text": soil_label,
                },
            )

            # BMP280 Temperatur + Druck
            try:
                temp_c = round(float(bmp280.temperature), 2)
                pressure_hpa = round(float(bmp280.pressure), 2)

                publish_sensor(
                    client,
                    SENSOR_TEMP_ID,
                    temp_c,
                    "C",
                    {"source": "pi5", "sensor": "BMP280", "metric": "temperature"},
                )
                publish_sensor(
                    client,
                    SENSOR_PRESSURE_ID,
                    pressure_hpa,
                    "hPa",
                    {"source": "pi5", "sensor": "BMP280", "metric": "pressure"},
                )
            except Exception as exc:
                # Bei BMP-Fehler senden wir ERROR mit null, damit im Backend sichtbar ist, dass Daten fehlen
                publish_sensor(
                    client,
                    SENSOR_TEMP_ID,
                    None,
                    "C",
                    {"source": "pi5", "sensor": "BMP280", "error": str(exc)},
                    status="ERROR",
                )
                publish_sensor(
                    client,
                    SENSOR_PRESSURE_ID,
                    None,
                    "hPa",
                    {"source": "pi5", "sensor": "BMP280", "error": str(exc)},
                    status="ERROR",
                )

            time.sleep(PUBLISH_INTERVAL)
    except KeyboardInterrupt:
        print("Stopping publisher...")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
