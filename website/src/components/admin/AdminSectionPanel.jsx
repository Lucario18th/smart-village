import React from 'react'
import GeneralSettingsForm from './forms/GeneralSettingsForm'
import ModulesSettingsForm from './forms/ModulesSettingsForm'
import ContentSettingsForm from './forms/ContentSettingsForm'
import EnergySettingsForm from './forms/EnergySettingsForm'
import SensorsSettingsForm from './forms/SensorsSettingsForm'
import StatisticsForm from './forms/StatisticsForm'
import DesignSettingsForm from './forms/DesignSettingsForm'

export default function AdminSectionPanel({
  section,
  entries,
  config,
  sensorTypes,
  onGeneralFieldChange,
  onModuleEnabledChange,
  onContentEnabledChange,
  onAddSensor,
  onUpdateSensor,
  onRemoveSensor,
  onDesignFieldChange,
}) {
  const renderForm = () => {
    if (section.id === 'general') {
      return <GeneralSettingsForm values={config.general} onChange={onGeneralFieldChange} />
    }

    if (section.id === 'modules') {
      return (
        <ModulesSettingsForm
          values={config.modules}
          onModuleEnabledChange={onModuleEnabledChange}
        />
      )
    }

    if (section.id === 'content') {
      return <ContentSettingsForm values={config.content} onContentEnabledChange={onContentEnabledChange} />
    }

    if (section.id === 'energy') {
      return <EnergySettingsForm values={config.modules} onModuleEnabledChange={onModuleEnabledChange} />
    }

    if (section.id === 'sensors') {
      return (
        <SensorsSettingsForm
          config={config}
          sensorTypes={sensorTypes || []}
          onAddSensor={onAddSensor}
          onUpdateSensor={onUpdateSensor}
          onRemoveSensor={onRemoveSensor}
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

      {section.id !== 'modules' && section.id !== 'content' && section.id !== 'energy' ? (
        <ul className="summary-list">
          {entries.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
