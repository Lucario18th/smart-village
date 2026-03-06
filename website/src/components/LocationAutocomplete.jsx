import React from 'react'
import { apiClient } from '../api/client'

const formatOption = (option) =>
  `${option.postalCode} ${option.city}${option.state ? ` (${option.state})` : ''}`

export default function LocationAutocomplete({
  label = 'PLZ oder Ort',
  placeholder = '12345 oder Berlin',
  onSelect,
  selectedOption = null,
  disabled = false,
}) {
  const [query, setQuery] = React.useState(selectedOption ? formatOption(selectedOption) : '')
  const [options, setOptions] = React.useState([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [showDropdown, setShowDropdown] = React.useState(false)

  React.useEffect(() => {
    setQuery(selectedOption ? formatOption(selectedOption) : '')
  }, [selectedOption?.id])

  React.useEffect(() => {
    if (!query || query.length < 2) {
      setOptions([])
      setShowDropdown(false)
      return
    }

    const handle = setTimeout(async () => {
      setIsLoading(true)
      setError('')
      try {
        const results = await apiClient.locations.search(query)
        setOptions(results)
        setShowDropdown(true)
      } catch (err) {
        console.error('Location search failed', err)
        setError('Suche fehlgeschlagen')
      } finally {
        setIsLoading(false)
      }
    }, 250)

    return () => clearTimeout(handle)
  }, [query])

  const handleSelect = (option) => {
    setQuery(formatOption(option))
    setOptions([])
    setShowDropdown(false)
    setError('')
    onSelect?.(option)
  }

  const handleInputChange = (event) => {
    setQuery(event.target.value)
    setShowDropdown(true)
    onSelect?.(null)
  }

  return (
    <div className="autocomplete">
      <label htmlFor="villageSearch">{label}</label>
      <input
        id="villageSearch"
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
      />
      {isLoading ? <small className="auth-hint">Lade Vorschläge…</small> : null}
      {error ? <small className="auth-error">{error}</small> : null}

      {showDropdown && options.length > 0 ? (
        <ul className="autocomplete-list">
          {options.map((option) => (
            <li key={option.id}>
              <button type="button" onClick={() => handleSelect(option)}>
                {formatOption(option)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {showDropdown && !isLoading && options.length === 0 && query.length >= 2 ? (
        <small className="auth-hint">Keine Ergebnisse</small>
      ) : null}
    </div>
  )
}
