import React, { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import { FALLBACK_LOCATION } from '../../../config/configModel'

const APP_PIN_PATH =
  'M430,560L530,560L530,360L505,360L505,300L455,300L455,360L430,360L430,560Z M480,774Q602,662 661,570.5Q720,479 720,408Q720,299 650.5,229.5Q581,160 480,160Q379,160 309.5,229.5Q240,299 240,408Q240,479 299,570.5Q358,662 480,774ZM480,880Q319,743 239.5,625.5Q160,508 160,408Q160,258 256.5,169Q353,80 480,80Q607,80 703.5,169Q800,258 800,408Q800,508 720.5,625.5Q641,743 480,880Z'

const PICKER_ICON = L.divIcon({
  className: 'map-leaflet-pin',
  html: `<svg class="map-pin-svg" viewBox="0 0 960 960" width="30" height="30" aria-hidden="true" focusable="false"><path fill="#1565c0" d="${APP_PIN_PATH}"/></svg>`,
  iconSize: [30, 30],
  iconAnchor: [15, 28],
  popupAnchor: [0, -24],
})

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function CenterSync({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true })
  }, [map, lat, lng])
  return null
}

export default function CoordinatePicker({ latitude, longitude, onChange }) {
  const hasCoords =
    latitude !== '' &&
    longitude !== '' &&
    latitude != null &&
    longitude != null &&
    !Number.isNaN(Number(latitude)) &&
    !Number.isNaN(Number(longitude))

  const center = hasCoords
    ? { lat: Number(latitude), lng: Number(longitude) }
    : FALLBACK_LOCATION

  return (
    <div className="coord-picker-wrap">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={15}
        className="coord-picker-map"
        style={{ cursor: 'crosshair' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {hasCoords && <CenterSync lat={center.lat} lng={center.lng} />}
        <ClickHandler onPick={onChange} />
        {hasCoords && (
          <Marker position={[center.lat, center.lng]} icon={PICKER_ICON} />
        )}
      </MapContainer>
      <p className="coord-picker-hint">
        Auf die Karte klicken, um den Standort zu setzen
      </p>
    </div>
  )
}
