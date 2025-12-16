import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

// SDK is configured in services/sdk-store.ts when first imported

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

