import { useEffect, useState } from 'react'
import mqtt from 'mqtt'

// Topic-Format: sv/{accountId}/{deviceId}/sensors/{sensorId}
const SENSOR_TOPIC = 'sv/+/+/sensors/+'

function parseSensorTopic(topic) {
  const parts = topic.split('/')
  if (parts.length !== 5 || parts[0] !== 'sv' || parts[3] !== 'sensors') return null
  const sensorId = Number(parts[4])
  return Number.isFinite(sensorId) ? sensorId : null
}

/**
 * Verbindet den Browser direkt per MQTT over WebSocket mit dem Mosquitto-Broker
 * (via Nginx-Proxy unter /mqtt) und gibt live eingehende Sensor-Messwerte zurück.
 *
 * @param {boolean} enabled  Verbindung nur aufbauen wenn true
 * @returns {{ [sensorId: number]: { value: number, ts: string } }}
 */
export function useMqttLiveReadings(enabled = true) {
  const [liveReadings, setLiveReadings] = useState({})

  useEffect(() => {
    if (!enabled) return

    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    const brokerUrl = `${protocol}://${location.host}/mqtt`

    const client = mqtt.connect(brokerUrl, {
      clientId: `sv-browser-${Math.random().toString(16).slice(2, 10)}`,
      reconnectPeriod: 5000,
      keepalive: 30,
    })

    client.on('connect', () => {
      client.subscribe(SENSOR_TOPIC)
    })

    client.on('message', (topic, payload) => {
      const sensorId = parseSensorTopic(topic)
      if (sensorId === null) return

      try {
        const data = JSON.parse(payload.toString())
        if (typeof data.value !== 'number') return

        setLiveReadings((prev) => ({
          ...prev,
          [sensorId]: {
            value: data.value,
            ts: data.ts ?? data.timestamp ?? new Date().toISOString(),
          },
        }))
      } catch {
        // ungültige Payloads ignorieren
      }
    })

    return () => {
      client.end(true)
    }
  }, [enabled])

  return liveReadings
}
