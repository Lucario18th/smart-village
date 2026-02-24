import React from 'react'
import GeneralSettingsForm from './forms/GeneralSettingsForm'
import ModulesSettingsForm from './forms/ModulesSettingsForm'
import DesignSettingsForm from './forms/DesignSettingsForm'

export default function AdminSectionPanel({
  section,
  entries,
  config,
  onGeneralFieldChange,
  onModuleEnabledChange,
  onModuleSourceChange,
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
          onModuleSourceChange={onModuleSourceChange}
        />
      )
    }

    if (section.id === 'design') {
      return <DesignSettingsForm values={config.design} onChange={onDesignFieldChange} />
    }

    return null
  }

  return (
    <section className="admin-panel" aria-live="polite">
      <h2>{section.title}</h2>
      <p>{section.description}</p>

      {renderForm()}

      <ul className="summary-list">
        {entries.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>
    </section>
  )
}
