import React from 'react'

export default function AdminSectionPanel({ section, entries }) {
  return (
    <section className="admin-panel" aria-live="polite">
      <h2>{section.title}</h2>
      <p>{section.description}</p>

      <ul>
        {entries.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>
    </section>
  )
}
