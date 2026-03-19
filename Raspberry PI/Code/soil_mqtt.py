#!/usr/bin/env python3
import os
import time
import json
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
from gpiozero import DigitalInputDevice

# ---------- Konfiguration ----------

# GPIO mit D0 des YL-69/LM393 (Pin 11 auf deinem Bild)
SOIL_GPIO = 17

# MQTT Broker
MQTT_URL = os.getenv("MQTT_URL", "mqtt://localhost:1883")
MQTT_HOST = MQTT_URL.replace("mqtt://", "").split(":")[0]
MQTT_PORT = int(MQTT_URL.split(":")[2]) if ":" in MQTT_URL[6:] else 1883

ACCOUNT_ID = os.getenv("ACCOUNT_ID", "1")
VILLAGE_KEY = os.getenv("VILLAGE", "loerrach")
DEVICE_ID = os.getenv("DEVICE_ID", f"gw-{VILLAGE_KEY}-1")

# Sensor-Definition (angelehnt an deinen TS-Code)
SENSOR_ID = int(os.getenv("SENSOR_ID", "71001"))  # beliebige eindeutige ID
SENSOR_TYPE_ID = 7  # Bodenfeuchte

# Publizierungsintervall in Sekunden
PUBLISH_INTERVAL = int(os.getenv("PUBLISH_INTERVAL", "10"))

# ---------- Geräte- & Sensor-Metadaten ----------

device_definition = {
    "deviceId": DEVICE_ID,
    "name": "Raspberry Pi Bodenfeuchte Gateway",
    "latitude": float(os.getenv("LAT", "47.6152")),
    "longitude": float(os.getenv("LNG", "7.6677")),
    "sensors": [
        {
            "sensorId": SENSOR_ID,
            "sensorTypeId": SENSOR_TYPE_ID,
            "name": "Bodenfeuchte (digital)",
            "unit": "%",  # wir leiten einen Pseudo-%-Wert ab
        }
    ],
    "kind": "gateway",
}

# Runtime-Status für den einen Sensor
sensor_state = {
    "lastSentAt": None,
    "isFailed": False,
    "stuck": False,
    "stuckValue": None,
    "soilMoisture": None,
}

# ---------- MQTT-Setup ----------

client = mqtt.Client()

def on_connect(client, userdata, flags, reason_code, properties=None):
    print(f"✅ MQTT connected to {MQTT_HOST}:{MQTT_PORT} (reason={reason_code})")
    publish_discovery()

def on_disconnect(client, userdata, reason_code, properties=None):
    print(f"⚠️ MQTT disconnected (reason={reason_code})")

client.on_connect = on_connect
client.on_disconnect = on_disconnect

client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)

# ---------- GPIO-Setup ----------

soil_sensor = DigitalInputDevice(SOIL_GPIO)

def interpret_soil(value: int) -> dict:
    """
    value: 0 oder 1 vom Digitalausgang.
    Viele LM393-Boards: 1 = trocken, 0 = feucht.
    """
    if value == 1:
        moisture_percent = 0.0
        status_text = "Boden ist trocken"
    else:
        moisture_percent = 100.0
        status_text = "Boden ist feucht"

    return {
        "value": moisture_percent,
        "statusText": status_text,
    }

# ---------- Discovery-Payload ----------

def publish_discovery():
    topic = f"sv/{ACCOUNT_ID}/{DEVICE_ID}/config"
    payload = {
        "village": VILLAGE_KEY,
        "device": {
            "name": device_definition["name"],
            "latitude": device_definition["latitude"],
            "longitude": device_definition["longitude"],
        },
        "sensors": [
            {
                "sensorId": SENSOR_ID,
                "sensorTypeId": SENSOR_TYPE_ID,
                "name": "Bodenfeuchte (digital)",
                "latitude": device_definition["latitude"],
                "longitude": device_definition["longitude"],
            }
        ],
    }
    client.publish(topic, json.dumps(payload), qos=1)
    print(f"📡 Discovery published to {topic}")

# ---------- Messungen senden ----------

def publish_measurement():
    now = datetime.now(timezone.utc)
    iso_ts = now.isoformat()

    raw = soil_sensor.value  # 0 oder 1
    interp = interpret_soil(raw)

    sensor_state["soilMoisture"] = interp["value"]
    sensor_state["lastSentAt"] = iso_ts

    payload = {
        "value": interp["value"],          # 0 oder 100
        "ts": iso_ts,
        "status": "OK",
        "unit": "%",
        "extra": {
            "source": "real_sensor",
            "digitalRaw": raw,
            "text": interp["statusText"],
        },
    }

    topic = f"sv/{ACCOUNT_ID}/{DEVICE_ID}/sensors/{SENSOR_ID}"
    client.publish(topic, json.dumps(payload), qos=0)

    print(
        f"[{iso_ts}] Bodenfeuchte: {interp['value']:.0f}% "
        f"(raw={raw}, {interp['statusText']}) -> {topic}"
    )

# ---------- Hauptschleife ----------

def main():
    client.loop_start()
    try:
        while True:
            publish_measurement()
            time.sleep(PUBLISH_INTERVAL)
    except KeyboardInterrupt:
        print("Stopping soil sender …")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()