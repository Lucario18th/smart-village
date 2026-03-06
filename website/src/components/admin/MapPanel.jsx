import React, { useMemo } from 'react'
import { FALLBACK_LOCATION } from '../../config/configModel'

const clampCoordinate = (value) => {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(numeric) ? numeric : null
}

const buildEmbedUrl = (lat, lng) => {
  const delta = 0.03
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join('%2C')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
}

export default function MapPanel({ general }) {
  const { center, isFallback, embedUrl } = useMemo(() => {
    const lat = clampCoordinate(general?.lat)
    const lng = clampCoordinate(general?.lng)

    if (lat !== null && lng !== null) {
      return { center: { lat, lng }, isFallback: false, embedUrl: buildEmbedUrl(lat, lng) }
    }

    return {
      center: FALLBACK_LOCATION,
      isFallback: true,
      embedUrl: buildEmbedUrl(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lng),
    }
  }, [general?.lat, general?.lng])

  const mapLabel =
    general?.postalCode && general?.city
      ? `${general.postalCode} ${general.city}`
      : 'Lörrach (Fallback)'

  return (
    <section className="map-panel">
      <p className="map-panel-hint" id="map-panel-hint">
        OpenStreetMap-Karte der Gemeinde. Mittelpunkt:{' '}
        <strong>{mapLabel}</strong>{' '}
        <span aria-label="Koordinaten">
          ({center.lat.toFixed(4)}, {center.lng.toFixed(4)})
        </span>
        {isFallback ? ' – Fallback wird genutzt, da keine Koordinaten vorliegen.' : ''}
      </p>

      <div className="map-frame" role="region" aria-label="Gemeindekarte">
        <iframe
          title="Gemeindekarte"
          src={embedUrl}
          aria-describedby="map-panel-hint"
          style={{ border: 0 }}
          loading="lazy"
          width="100%"
          height="420"
        />
      </div>

      <p className="map-panel-meta">
        <a
          href={`https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lng}#map=13/${center.lat}/${center.lng}`}
          target="_blank"
          rel="noreferrer"
        >
          In OpenStreetMap öffnen
        </a>
      </p>
    </section>
  )
}
