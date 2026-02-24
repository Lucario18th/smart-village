import React from 'react'
import data from './data.json'

export default function App() {
  return (
    <main className="app">
      <header className="app-header">
        <h1>Smart Village</h1>
        <p>Beispielseite mit React + Vite</p>
      </header>

      <section className="cards">
        {data.items.map((item) => (
          <article key={item.id} className="card">
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <footer className="app-footer">© {new Date().getFullYear()} Smart Village</footer>
    </main>
  )
}

