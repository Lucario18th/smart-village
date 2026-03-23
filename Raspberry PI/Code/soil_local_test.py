#!/usr/bin/env python3
import time
import board
import adafruit_bmp280
from gpiozero import DigitalInputDevice

# --------- Konfiguration ---------

# BMP280 I2C-Adresse
BMP280_ADDR = 0x76
SEA_LEVEL_PRESSURE = 1013.25

# GPIO, an dem D0 des YL-69/LM393 hängt (Pin 11 = GPIO17)
SOIL_GPIO = 17

DRY_PERCENT = 15.0    # sehr trocken
MOIST_PERCENT = 85.0  # sehr feucht
SMOOTHING_ALPHA = 0.4

# --------- Sensor-Initialisierung ---------

# BMP280
i2c = board.I2C()
bmp280 = adafruit_bmp280.Adafruit_BMP280_I2C(i2c, address=BMP280_ADDR)
bmp280.sea_level_pressure = SEA_LEVEL_PRESSURE

# YL-69 digital
soil_input = DigitalInputDevice(SOIL_GPIO, pull_up=False)
last_soil_percent = None

# --------- Hilfsfunktionen ---------

def soil_raw_to_percent(raw: int):
    global last_soil_percent

    if raw == 1:
        target = DRY_PERCENT
        label = "sehr trocken"
    else:
        target = MOIST_PERCENT
        label = "nass/feucht"

    if last_soil_percent is None:
        percent = target
    else:
        percent = last_soil_percent + SMOOTHING_ALPHA * (target - last_soil_percent)

    last_soil_percent = percent
    return percent, label

def main():
    print("Starte Umwelt- und Bodenfeuchte-Test (BMP280 + YL-69)\n")

    try:
        while True:
            # BMP280
            try:
                temp = bmp280.temperature      # °C
                press = bmp280.pressure        # hPa
                alt = bmp280.altitude          # m
                print(f"Temp:   {temp:6.2f} °C")
                print(f"Druck:  {press:6.2f} hPa")
                print(f"Höhe:   {alt:6.2f} m")
            except Exception as e:
                print(f"BMP280-Fehler: {e}")

            # YL-69
            raw = soil_input.value
            soil_percent, soil_label = soil_raw_to_percent(raw)
            print(
                f"Boden: Roh={raw}, "
                f"geschätzt={soil_percent:5.1f} %, "
                f"Status={soil_label}"
            )

            print("-" * 40)
            time.sleep(2.0)

    except KeyboardInterrupt:
        print("\nBeendet.")

if __name__ == "__main__":
    main()
