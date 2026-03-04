-- Seed SensorType data
INSERT INTO "SensorType" (name, unit, description) VALUES 
  ('Temperature', '°C', 'Lufttemperatur'),
  ('Humidity', '%', 'Luftfeuchte'),
  ('Pressure', 'hPa', 'Luftdruck'),
  ('Rainfall', 'mm', 'Niederschlag'),
  ('Wind Speed', 'm/s', 'Windgeschwindigkeit'),
  ('Solar Radiation', 'W/m²', 'Solarstrahlung'),
  ('Soil Moisture', '%', 'Bodenfeuchte'),
  ('CO2', 'ppm', 'Kohlendioxid-Konzentration')
ON CONFLICT DO NOTHING;
