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
  onGeneralEditingChange,
  onGeneralSave,
  isGeneralSaving,
  canGeneralSave,
  onModuleEnabledChange,
  onNavigateToSensors,
  onUpdateSensor,
  onUpdateDevice,
  onDesignFieldChange,
  internalVillageId,
  onDeleteAccount,
  isDeleteLoading,
}) {
  const renderForm = () => {
    if (section.id === 'map') {
      return (
        <MapPanel
          general={config.general}
          sensors={config.sensors || []}
          devices={config.devices || []}
        />
      )
    }

    if (section.id === 'general') {
      return (
        <GeneralSettingsForm
          values={config.general}
          onChange={onGeneralFieldChange}
          internalVillageId={internalVillageId}
          onEditingChange={onGeneralEditingChange}
          onSave={onGeneralSave}
          isSaving={isGeneralSaving}
          canSave={canGeneralSave}
        />
      )
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
      return (
        <DesignSettingsForm
          values={config.design}
          onChange={onDesignFieldChange}
          onDeleteAccount={onDeleteAccount}
          isDeleteLoading={isDeleteLoading}
        />
      )
    }

    return null
  }

  return (
    <section className="admin-panel" aria-live="polite">
      {section.id !== 'map' ? (
        <header className="admin-section-header">
          <h2>{section.title}</h2>
          <p>{section.description}</p>
        </header>
      ) : null}

      {renderForm()}

      {section.id !== 'map' && entries.length > 0 ? (
        <ul className="summary-list">
          {entries.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
