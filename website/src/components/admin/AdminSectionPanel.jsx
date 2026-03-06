import React from 'react'
import GeneralSettingsForm from './forms/GeneralSettingsForm'
import ModulesSettingsForm from './forms/ModulesSettingsForm'
import SensorsSettingsForm from './forms/SensorsSettingsForm'
import StatisticsForm from './forms/StatisticsForm'
import DesignSettingsForm from './forms/DesignSettingsForm'
import MapPanel from './MapPanel'

export default function AdminSectionPanel({
  section,
  entries,
  config,
  selectedModule,
  sensorTypes,
  onGeneralFieldChange,
  onModuleEnabledChange,
  onNavigateToSensors,
  onUpdateSensor,
  onUpdateDevice,
  onDesignFieldChange,
}) {
  const renderForm = () => {
    if (section.id === 'map') {
      return <MapPanel general={config.general} />
    }

    if (section.id === 'general') {
      return <GeneralSettingsForm values={config.general} onChange={onGeneralFieldChange} />
    }

    if (section.id === 'modules') {
      return (
        <ModulesSettingsForm
          values={config.modules}
          onModuleEnabledChange={onModuleEnabledChange}
          onNavigateToSensors={onNavigateToSensors}
        />
      )
    }

    if (section.id === 'sensors') {
      return (
        <SensorsSettingsForm
          config={config}
          sensorTypes={sensorTypes || []}
          onUpdateSensor={onUpdateSensor}
          onUpdateDevice={onUpdateDevice}
        />
      )
    }

    if (section.id === 'statistics') {
      return <StatisticsForm config={config} />
    }

    if (section.id === 'design') {
      return <DesignSettingsForm values={config.design} onChange={onDesignFieldChange} />
    }

    return null
  }

  return (
    <section className="admin-panel" aria-live="polite">
      <header className="admin-section-header">
        <h2>{section.title}</h2>
        <p>{section.description}</p>
      </header>

      {renderForm()}

      <ul className="summary-list">
        {entries.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>
    </section>
  )
}
