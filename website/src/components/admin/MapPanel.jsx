import React, { useEffect, useMemo, useState } from 'react'
import { FALLBACK_LOCATION } from '../../config/configModel'
import { geocodeCity } from '../../utils/geocoding'

const buildEmbedUrl = (lat, lng) => {
  const delta = 0.03
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join('%2C')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
}

export default function MapPanel({ general }) {
  const [center, setCenter] = useState(FALLBACK_LOCATION)
  const [isFallback, setIsFallback] = useState(true)
  const [error, setError] = useState('')

  const locationLabel =
    general?.zipCode && general?.city ? `${general.zipCode} ${general.city}` : 'Lörrach (Fallback)'

  useEffect(() => {
    let cancelled = false
    const zip = general?.zipCode || ''
    const city = general?.city || ''

    if (!zip && !city) {
      setCenter(FALLBACK_LOCATION)
      setIsFallback(true)
      setError('')
      return
    }

    geocodeCity(zip, city)
      .then((coords) => {
        if (cancelled) return
        setCenter(coords)
        setIsFallback(false)
        setError('')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Geocoding failed', err)
        setCenter(FALLBACK_LOCATION)
        setIsFallback(true)
        setError('Geokodierung fehlgeschlagen, Fallback wird genutzt.')
      })

    return () => {
      cancelled = true
    }
  }, [general?.zipCode, general?.city])

  const embedUrl = useMemo(
    () => buildEmbedUrl(center.lat, center.lng),
    [center.lat, center.lng]
  )

  return (
    <section className="map-panel">
      <p className="map-panel-hint" id="map-panel-hint">
        OpenStreetMap-Karte der Gemeinde. Mittelpunkt:{' '}
        <strong>{locationLabel}</strong>{' '}
        <span aria-label="Koordinaten">
          ({center.lat.toFixed(4)}, {center.lng.toFixed(4)})
        </span>
        {isFallback ? ' – Fallback wird genutzt, da Koordinaten dynamisch geokodiert werden.' : ''}
      </p>
      {error ? <p className="map-panel-error">{error}</p> : null}

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
