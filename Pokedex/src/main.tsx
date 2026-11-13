import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { createServiceProvider } from './app/ServiceProvider'
import { ServiceContext } from './app/serviceContext'
import './index.css'

const serviceProvider = createServiceProvider()

const rootElement = document.getElementById('root')
if (rootElement === null) throw new Error('The #root element is missing from index.html.')

createRoot(rootElement).render(
  <StrictMode>
    <ServiceContext value={serviceProvider}>
      <App />
    </ServiceContext>
  </StrictMode>,
)
