import React, { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient } from '../../../api/client'

const SENSOR_FIELD_TOGGLES = [
  { id: 'name', label: 'Name' },
  { id: 'type', label: 'Typ' },
  { id: 'description', label: 'Beschreibung' },
  { id: 'gateway', label: 'Gateway' },
  { id: 'coordinates', label: 'Koordinaten' },
  { id: 'status', label: 'Aktueller Status' },
]

const DEFAULT_SENSOR_FIELDS = {
  name: true,
  type: true,
  description: true,
  gateway: true,
  coordinates: true,
  status: true,
}

const MODULE_ICON_OPTIONS = [
  { key: 'sensors', label: 'Sensor' },
  { key: 'weather', label: 'Wetter' },
  { key: 'messages', label: 'Nachrichten' },
  { key: 'map', label: 'Karte' },
  { key: 'rideshare', label: 'Mobilitaet' },
  { key: 'events', label: 'Events' },
  { key: 'textile', label: 'Container' },
  { key: 'tree', label: 'Baeume' },
  { key: 'water', label: 'Wasser' },
  { key: 'camera', label: 'Kamera' },
  { key: 'energy', label: 'Energie' },
]

const MODULE_TYPE_OPTIONS = [
  'Mobilitaet',
  'Info',
  'Service',
  'Umwelt',
  'Sicherheit',
  'Energie',
  'Community',
]

function getModuleIconLabel(iconKey) {
  return MODULE_ICON_OPTIONS.find((option) => option.key === iconKey)?.label || 'Sensor'
}

function ServiceCard({
  title,
  description,
  placement,
  category,
  isEnabled,
  onEnabledChange,
  isEditing,
  secondaryControl,
  isExpanded = false,
  children,
}) {
  return (
    <article className={`service-card${isExpanded ? ' service-card--expanded' : ''}`}>
      <div className="service-card-content">
        <div className="service-card-head">
          <h3>{title}</h3>
          <span className="service-badge">{category}</span>
        </div>
        <p>{description}</p>
        <div className="service-meta-row">
          <p className="service-meta">Sichtbar in: {placement}</p>
        </div>
        {children}
      </div>

      <div className="service-card-controls">
        <label className="switch-control">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
            aria-label={`${title} aktivieren`}
            disabled={!isEditing}
          />
          <span className="switch-slider" aria-hidden="true" />
        </label>
        {secondaryControl}
      </div>
    </article>
  )
}

export default function ModulesSettingsForm({
  values,
  onModuleEnabledChange,
  onModuleFieldEnabledChange,
  onSave,
  isSaving = false,
  canSave = false,
  villageId = null,
  sensors = [],
}) {
  const safeValues = values && typeof values === 'object' ? values : {}
  const [isEditing, setIsEditing] = useState(false)
  const editSnapshotRef = useRef(null)
  const sensorFields = {
    ...DEFAULT_SENSOR_FIELDS,
    ...(safeValues.sensors?.fields || {}),
  }

  // ── Custom Modules State ──────────────────────────────────────────────────
  const [customModules, setCustomModules] = useState([])
  const [modulesLoading, setModulesLoading] = useState(false)
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [editingModule, setEditingModule] = useState(null) // null = new, object = edit
  const [moduleForm, setModuleForm] = useState({
    name: '',
    description: '',
    iconKey: 'sensors',
    moduleType: 'Service',
    sensorIds: [],
  })
  const [moduleFormError, setModuleFormError] = useState('')
  const [moduleFormSaving, setModuleFormSaving] = useState(false)
  const [deletingModuleId, setDeletingModuleId] = useState(null)
  const [sensorSearch, setSensorSearch] = useState('')

  const loadCustomModules = useCallback(async () => {
    if (!villageId) return
    setModulesLoading(true)
    try {
      const data = await apiClient.villageModules.list(villageId)
      setCustomModules(data)
    } catch {
      /* ignore */
    } finally {
      setModulesLoading(false)
    }
  }, [villageId])

  useEffect(() => {
    loadCustomModules()
  }, [loadCustomModules])

  const openCreateForm = () => {
    if (!isEditing) return
    setEditingModule(null)
    setModuleForm({ name: '', description: '', iconKey: 'sensors', moduleType: 'Service', sensorIds: [] })
    setModuleFormError('')
    setShowModuleForm(true)
  }

  const openEditForm = (mod) => {
    if (!isEditing) return
    setEditingModule(mod)
    setModuleForm({
      name: mod.name,
      description: mod.description,
      iconKey: mod.iconKey || 'sensors',
      moduleType: mod.moduleType || 'Service',
      sensorIds: [...mod.sensorIds],
    })
    setModuleFormError('')
    setShowModuleForm(true)
  }

  const cancelModuleForm = () => {
    setShowModuleForm(false)
    setEditingModule(null)
    setModuleFormError('')
    setSensorSearch('')
  }

  const handleModuleFormSave = async () => {
    if (!moduleForm.name.trim()) {
      setModuleFormError('Bitte einen Namen eingeben.')
      return
    }
    setModuleFormSaving(true)
    setModuleFormError('')
    try {
      if (editingModule) {
        const updated = await apiClient.villageModules.update(villageId, editingModule.id, {
          name: moduleForm.name.trim(),
          description: moduleForm.description.trim(),
          iconKey: moduleForm.iconKey,
          moduleType: moduleForm.moduleType,
          sensorIds: moduleForm.sensorIds,
        })
        setCustomModules((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
      } else {
        const created = await apiClient.villageModules.create(villageId, {
          name: moduleForm.name.trim(),
          description: moduleForm.description.trim(),
          iconKey: moduleForm.iconKey,
          moduleType: moduleForm.moduleType,
          sensorIds: moduleForm.sensorIds,
        })
        setCustomModules((prev) => [...prev, created])
      }
      cancelModuleForm()
    } catch (err) {
      setModuleFormError(err.message || 'Speichern fehlgeschlagen')
    } finally {
      setModuleFormSaving(false)
    }
  }

  const handleDeleteModule = async (moduleId) => {
    if (!isEditing) return
    setDeletingModuleId(moduleId)
    try {
      await apiClient.villageModules.delete(villageId, moduleId)
      setCustomModules((prev) => prev.filter((m) => m.id !== moduleId))
    } catch (err) {
      // Falls das Modul serverseitig bereits weg ist, UI trotzdem synchronisieren.
      if (err?.status === 404 || err?.message?.includes('nicht gefunden')) {
        setCustomModules((prev) => prev.filter((m) => m.id !== moduleId))
      }
    } finally {
      setDeletingModuleId(null)
    }
  }

  const handleToggleModuleEnabled = async (mod) => {
    if (!isEditing) return
    try {
      const updated = await apiClient.villageModules.update(villageId, mod.id, {
        isEnabled: !mod.isEnabled,
      })
      setCustomModules((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
    } catch {
      /* ignore */
    }
  }

  const toggleModuleFormSensor = (sensorId) => {
    setModuleForm((prev) => {
      const ids = prev.sensorIds
      return {
        ...prev,
        sensorIds: ids.includes(sensorId) ? ids.filter((id) => id !== sensorId) : [...ids, sensorId],
      }
    })
  }

  const modules = [
    {
      id: 'weather',
      title: 'Wetterdaten',
      description: 'Lokale Wetter- und Klimainformationen',
      placement: 'Startseite und Wetterbereich',
      category: 'Umwelt',
    },
    {
      id: 'news',
      title: 'Nachrichten',
      description: 'Lokale Informationen und Ankündigungen',
      placement: 'Startseite und News-Feed',
      category: 'Info',
    },
    {
      id: 'events',
      title: 'Veranstaltungen',
      description: 'Lokale Termine und Veranstaltungen',
      placement: 'Kalender und Startseite',
      category: 'Community',
    },
    {
      id: 'map',
      title: 'Karte',
      description: 'Interaktive Karte mit Orten, Sensoren und relevanten Punkten',
      placement: 'Tab-Navigation und Detailseiten',
      category: 'Navigation',
    },
    {
      id: 'userAssistantAi',
      title: 'KI-Hilfe (User)',
      description: 'Lokalen KI-Assistenten für die User-Seite ein- oder ausschalten',
      placement: 'Header der User-Seite',
      category: 'Service',
    },
  ]

  const toggleEditing = () => {
    if (!isEditing) {
      editSnapshotRef.current = {
        modules: Object.fromEntries(
          modules.map((module) => [module.id, safeValues[module.id]?.enabled ?? false])
        ),
        sensorsEnabled: safeValues.sensors?.enabled ?? true,
        sensorFields: { ...sensorFields },
      }
      setIsEditing(true)
      return
    }

    if (editSnapshotRef.current) {
      Object.entries(editSnapshotRef.current.modules || {}).forEach(([moduleId, enabled]) => {
        onModuleEnabledChange(moduleId, enabled)
      })
      if (editSnapshotRef.current.sensorsEnabled !== undefined) {
        onModuleEnabledChange('sensors', editSnapshotRef.current.sensorsEnabled)
      }
      Object.entries(editSnapshotRef.current.sensorFields || {}).forEach(([fieldId, enabled]) => {
        onModuleFieldEnabledChange?.('sensors', fieldId, enabled)
      })
    }

    editSnapshotRef.current = null
    setIsEditing(false)
    setShowModuleForm(false)
    setEditingModule(null)
    setModuleFormError('')
    setSensorSearch('')
  }

  const handleSave = () => {
    onSave?.()
    editSnapshotRef.current = null
    setIsEditing(false)
  }

  const handleModuleEnabledChange = (moduleId, enabled) => {
    onModuleEnabledChange(moduleId, enabled)
  }

  const isSensorsEnabled = safeValues.sensors?.enabled ?? true

  return (
    <section className="module-settings">
      <div className="module-settings-head">
        <p className="module-settings-hint">
          Hier steuern Sie, welche Module und Dienste in der App sichtbar sind.
        </p>

        <div className="general-form-actions">
          {isEditing ? (
            <button
              type="button"
              className="general-save-button"
              onClick={handleSave}
              disabled={isSaving || !canSave}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Zm-5 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm3-10H5V5h10v4Z"
                />
              </svg>
              <span>{isSaving ? 'Speichern...' : 'Speichern'}</span>
            </button>
          ) : null}

          <button type="button" className="edit-toggle-button" onClick={toggleEditing}>
            {isEditing ? (
              <>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.4 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.3l6.3 6.3 6.29-6.3 1.42 1.41Z"
                  />
                </svg>
                <span>Abbrechen</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="m3 17.25 9.06-9.06 3.75 3.75L6.75 21H3v-3.75ZM20.71 7.04a1 1 0 0 0 0-1.42l-2.34-2.33a1 1 0 0 0-1.41 0l-1.78 1.77 3.75 3.75 1.78-1.77Z"
                  />
                </svg>
                <span>Bearbeiten</span>
              </>
            )}
          </button>
        </div>
      </div>

      {!values && (
        <p className="auth-hint">Moduldaten konnten nicht geladen werden. Standardwerte werden angezeigt.</p>
      )}

      {/* ── Sensor-Übertragungseinstellungen ────────────────────────── */}
      <div className="sensor-settings-card">
        <div className="sensor-settings-head">
          <div className="sensor-settings-info">
            <h3 className="sensor-settings-title">Sensordaten-Übertragung</h3>
            <p className="sensor-settings-desc">
              Steuert, ob Sensordaten an die App übertragen werden und welche Felder dabei sichtbar sind.
              Diese Einstellung gilt global für alle Module.
            </p>
          </div>
          <label className="switch-control" aria-label="Sensordaten-Übertragung aktivieren">
            <input
              type="checkbox"
              checked={isSensorsEnabled}
              onChange={(e) => {
                onModuleEnabledChange('sensors', e.target.checked)
                if (!e.target.checked) {
                  SENSOR_FIELD_TOGGLES.forEach((f) => onModuleFieldEnabledChange?.('sensors', f.id, false))
                }
              }}
              disabled={!isEditing}
            />
            <span className="switch-slider" aria-hidden="true" />
          </label>
        </div>
        {isSensorsEnabled && (
          <div className="sensor-settings-fields">
            <p className="sensor-settings-fields-label">Angezeigte Felder in der App</p>
            <ul className="sensor-settings-field-list">
              {SENSOR_FIELD_TOGGLES.map((field) => (
                <li key={field.id} className="sensor-settings-field-item">
                  <span>{field.label}</span>
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={sensorFields[field.id] ?? false}
                      onChange={(e) => onModuleFieldEnabledChange?.('sensors', field.id, e.target.checked)}
                      disabled={!isEditing}
                      aria-label={`${field.label} anzeigen`}
                    />
                    <span className="switch-slider" aria-hidden="true" />
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="module-settings-section-label">App-Module</p>
      <div className="service-grid">
        {modules.map((module) => (
          <ServiceCard
            key={module.id}
            title={module.title}
            description={module.description}
            placement={module.placement}
            category={module.category}
            isEnabled={safeValues[module.id]?.enabled ?? false}
            onEnabledChange={(enabled) => handleModuleEnabledChange(module.id, enabled)}
            isEditing={isEditing}
          >
            {null}
          </ServiceCard>
        ))}
      </div>

      {/* ── Eigene Module ───────────────────────────────────────────── */}
      {villageId && (
        <div className="custom-modules-section">
          <div className="custom-modules-header">
            <div>
              <h2 className="custom-modules-title">Eigene Module</h2>
              <p className="custom-modules-hint">
                Erstellen Sie eigene Module und ordnen Sie Sensoren zu.
              </p>
            </div>
            <button type="button" className="cm-add-btn" onClick={openCreateForm} disabled={!isEditing}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2Z" />
              </svg>
              Neues Modul
            </button>
          </div>

          {modulesLoading && <p className="cm-loading">Lade Module…</p>}

          {!modulesLoading && customModules.length === 0 && (
            <p className="cm-empty">Noch keine eigenen Module vorhanden.</p>
          )}

          {!modulesLoading && customModules.length > 0 && (
            <div className="service-grid service-grid--custom">
              {customModules.map((mod) => (
                <ServiceCard
                  key={mod.id}
                  title={mod.name}
                  description={mod.description || 'Benutzerdefiniertes Modul'}
                  placement="Nutzer-Navigation und Detailansicht"
                  category={mod.moduleType || 'Service'}
                  isEnabled={mod.isEnabled}
                  onEnabledChange={() => handleToggleModuleEnabled(mod)}
                  isEditing={isEditing}
                  secondaryControl={(
                    <div className="service-card-side-actions">
                      <button
                        type="button"
                        className="cm-icon-btn cm-edit-btn"
                        onClick={() => openEditForm(mod)}
                        disabled={!isEditing}
                        aria-label={`${mod.name} bearbeiten`}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path fill="currentColor" d="m3 17.25 9.06-9.06 3.75 3.75L6.75 21H3v-3.75ZM20.71 7.04a1 1 0 0 0 0-1.42l-2.34-2.33a1 1 0 0 0-1.41 0l-1.78 1.77 3.75 3.75 1.78-1.77Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="cm-icon-btn cm-delete-btn"
                        onClick={() => handleDeleteModule(mod.id)}
                        disabled={!isEditing || deletingModuleId === mod.id}
                        aria-label={`${mod.name} löschen`}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z" />
                        </svg>
                      </button>
                    </div>
                  )}
                >
                  <div className="service-meta-row">
                    <p className="service-meta">Icon: {getModuleIconLabel(mod.iconKey)}</p>
                  </div>
                  <div className="service-meta-row">
                    <p className="service-meta">
                      {mod.sensorIds.length === 0
                        ? 'Keine Sensoren zugeordnet'
                        : `${mod.sensorIds.length} Sensor${mod.sensorIds.length === 1 ? '' : 'en'} zugeordnet`}
                    </p>
                  </div>
                </ServiceCard>
              ))}
            </div>
          )}

          {/* Modul-Formular (Erstellen / Bearbeiten) */}
          {showModuleForm && (
            <div className="cm-form-overlay" role="dialog" aria-modal="true" aria-label={editingModule ? 'Modul bearbeiten' : 'Neues Modul'}>
              <div className="cm-form-card">
                <h3 className="cm-form-title">{editingModule ? 'Modul bearbeiten' : 'Neues Modul'}</h3>

                <div className="cm-form-static">
                  <label className="cm-form-label">
                    Name <span aria-hidden="true">*</span>
                    <input
                      type="text"
                      className="cm-form-input"
                      value={moduleForm.name}
                      onChange={(e) => setModuleForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="z. B. Luftqualität Dorfplatz"
                      maxLength={80}
                      autoFocus
                    />
                  </label>

                  <label className="cm-form-label">
                    Beschreibung
                    <input
                      type="text"
                      className="cm-form-input"
                      value={moduleForm.description}
                      onChange={(e) => setModuleForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Optional"
                      maxLength={200}
                    />
                  </label>

                  <div className="cm-form-two-cols">
                    <label className="cm-form-label">
                      Icon
                      <select
                        className="cm-form-input"
                        value={moduleForm.iconKey}
                        onChange={(e) => setModuleForm((p) => ({ ...p, iconKey: e.target.value }))}
                      >
                        {MODULE_ICON_OPTIONS.map((option) => (
                          <option key={option.key} value={option.key}>{option.label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="cm-form-label">
                      Typ
                      <select
                        className="cm-form-input"
                        value={moduleForm.moduleType}
                        onChange={(e) => setModuleForm((p) => ({ ...p, moduleType: e.target.value }))}
                      >
                        {MODULE_TYPE_OPTIONS.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {sensors.length > 0 && (
                  <fieldset className="cm-sensor-fieldset">
                    <legend className="cm-sensor-legend">Sensoren zuordnen</legend>
                    <div className="cm-sensor-search-wrap">
                      <svg className="cm-sensor-search-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"/>
                      </svg>
                      <input
                        type="search"
                        className="cm-sensor-search"
                        placeholder="Sensors suchen…"
                        value={sensorSearch}
                        onChange={(e) => setSensorSearch(e.target.value)}
                        aria-label="Sensoren filtern"
                      />
                    </div>
                    <ul className="cm-sensor-list">
                      {sensors.filter((s) => {
                        const q = sensorSearch.trim().toLowerCase()
                        if (!q) return true
                        return s.name?.toLowerCase().includes(q) || s.type?.toLowerCase().includes(q)
                      }).map((s) => (
                        <li key={s.id} className="cm-sensor-item">
                          <label className="cm-sensor-label">
                            <input
                              type="checkbox"
                              checked={moduleForm.sensorIds.includes(s.id)}
                              onChange={() => toggleModuleFormSensor(s.id)}
                            />
                            <span className="cm-sensor-name">{s.name}</span>
                            {s.type && <span className="cm-sensor-type">{s.type}</span>}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </fieldset>
                )}

                {moduleFormError && <p className="cm-form-error">{moduleFormError}</p>}

                <div className="cm-form-actions cm-form-actions--footer">
                  <button type="button" className="cm-form-cancel" onClick={cancelModuleForm} disabled={moduleFormSaving}>
                    Abbrechen
                  </button>
                  <button type="button" className="cm-form-save" onClick={handleModuleFormSave} disabled={moduleFormSaving}>
                    {moduleFormSaving ? 'Speichern…' : 'Speichern'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
