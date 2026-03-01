import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './css/light.css'
import './css/light-mc.css'
import './css/light-hc.css'
import './css/dark.css'
import './css/dark-mc.css'
import './css/dark-hc.css'
import './styles.css'

const container = document.getElementById('root')
const root = createRoot(container)

document.documentElement.classList.add('light')

root.render(<App />)

