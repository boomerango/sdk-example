import { useState, useCallback } from 'react'
import { configure, globalClient } from '@telemetryos/sdk'
import { name } from '~/telemetry.config.json'
import { Logger } from '../components/Logger'
import { LogEntry } from '../types'
import {
  sendStoreValue,
  getStoreValue,
  clearStoreValue,
  sendSharedStoreValue,
  getSharedStoreValue,
  clearSharedStoreValue,
} from '../services/sdk-store'
import './Web.css'

const APP_NAME = name

// Web mount point: no applicationInstance required — configure unconditionally
if (!globalClient()) {
  try {
    configure(APP_NAME)
  } catch (error) {
    console.error('Failed to configure SDK:', error)
  }
}

export function Web() {
  const [logs, setLogs] = useState<LogEntry[]>([])

  // Application store state
  const [appKey, setAppKey] = useState('webKey')
  const [appValue, setAppValue] = useState('')
  const [appCurrentValue, setAppCurrentValue] = useState<any>(undefined)

  // Shared store state
  const [sharedNamespace, setSharedNamespace] = useState('test-namespace')
  const [sharedKey, setSharedKey] = useState('webKey')
  const [sharedValue, setSharedValue] = useState('')
  const [sharedCurrentValue, setSharedCurrentValue] = useState<any>(undefined)

  const addLog = useCallback((log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs((prev) => [{ ...log, id: `${Date.now()}-${Math.random()}`, timestamp: new Date() }, ...prev])
  }, [])

  // Application store handlers
  const handleAppSet = async () => {
    try {
      await sendStoreValue({ key: appKey, value: appValue, scope: 'application' })
      addLog({ level: 'success', method: 'store().application.set', message: `Set "${appKey}"`, data: { value: appValue } })
    } catch (error: any) {
      addLog({ level: 'error', method: 'store().application.set', message: error.message, data: {} })
    }
  }

  const handleAppGet = async () => {
    try {
      const value = await getStoreValue({ key: appKey, scope: 'application' })
      setAppCurrentValue(value)
      addLog({ level: 'success', method: 'store().application.get', message: `Got "${appKey}"`, data: { value } })
    } catch (error: any) {
      addLog({ level: 'error', method: 'store().application.get', message: error.message, data: {} })
    }
  }

  const handleAppDelete = async () => {
    try {
      await clearStoreValue({ key: appKey, scope: 'application' })
      addLog({ level: 'success', method: 'store().application.delete', message: `Deleted "${appKey}"`, data: {} })
    } catch (error: any) {
      addLog({ level: 'error', method: 'store().application.delete', message: error.message, data: {} })
    }
  }

  // Shared store handlers
  const handleSharedSet = async () => {
    try {
      await sendSharedStoreValue({ namespace: sharedNamespace, key: sharedKey, value: sharedValue })
      addLog({ level: 'success', method: 'store().shared.set', message: `Set "${sharedNamespace}/${sharedKey}"`, data: { value: sharedValue } })
    } catch (error: any) {
      addLog({ level: 'error', method: 'store().shared.set', message: error.message, data: {} })
    }
  }

  const handleSharedGet = async () => {
    try {
      const value = await getSharedStoreValue({ namespace: sharedNamespace, key: sharedKey })
      setSharedCurrentValue(value)
      addLog({ level: 'success', method: 'store().shared.get', message: `Got "${sharedNamespace}/${sharedKey}"`, data: { value } })
    } catch (error: any) {
      addLog({ level: 'error', method: 'store().shared.get', message: error.message, data: {} })
    }
  }

  const handleSharedDelete = async () => {
    try {
      await clearSharedStoreValue({ namespace: sharedNamespace, key: sharedKey })
      addLog({ level: 'success', method: 'store().shared.delete', message: `Deleted "${sharedNamespace}/${sharedKey}"`, data: {} })
    } catch (error: any) {
      addLog({ level: 'error', method: 'store().shared.delete', message: error.message, data: {} })
    }
  }

  return (
    <div className="web">
      <div className="web-header">
        <h1>TelemetryOS SDK Example — Web</h1>
        <p className="web-subtitle">
          Web mount point: browser-accessible, no device context.
          Only <code>application</code> and <code>shared(namespace)</code> store scopes are available.
        </p>
      </div>

      <div className="web-content">
        <div className="web-stores">
          {/* Application Store */}
          <div className="web-section">
            <h2>Application Store</h2>
            <p className="web-section-info">Shared across all instances within the account</p>
            <div className="web-current-value">
              <strong>Current value:</strong>{' '}
              {appCurrentValue !== undefined ? JSON.stringify(appCurrentValue) : '(empty)'}
            </div>
            <div className="web-input-row">
              <input
                type="text"
                value={appKey}
                onChange={(e) => setAppKey(e.target.value)}
                placeholder="Key"
                className="web-input"
              />
              <input
                type="text"
                value={appValue}
                onChange={(e) => setAppValue(e.target.value)}
                placeholder="Value to set"
                className="web-input"
              />
            </div>
            <div className="web-buttons">
              <button onClick={handleAppSet} className="btn btn-primary">Set</button>
              <button onClick={handleAppGet} className="btn btn-secondary">Get</button>
              <button onClick={handleAppDelete} className="btn btn-danger">Delete</button>
            </div>
          </div>

          {/* Shared Store */}
          <div className="web-section">
            <h2>Shared Store</h2>
            <p className="web-section-info">Shared between applications via namespace</p>
            <div className="web-current-value">
              <strong>Current value:</strong>{' '}
              {sharedCurrentValue !== undefined ? JSON.stringify(sharedCurrentValue) : '(empty)'}
            </div>
            <div className="web-input-row">
              <input
                type="text"
                value={sharedNamespace}
                onChange={(e) => setSharedNamespace(e.target.value)}
                placeholder="Namespace"
                className="web-input"
              />
              <input
                type="text"
                value={sharedKey}
                onChange={(e) => setSharedKey(e.target.value)}
                placeholder="Key"
                className="web-input"
              />
              <input
                type="text"
                value={sharedValue}
                onChange={(e) => setSharedValue(e.target.value)}
                placeholder="Value to set"
                className="web-input"
              />
            </div>
            <div className="web-buttons">
              <button onClick={handleSharedSet} className="btn btn-primary">Set</button>
              <button onClick={handleSharedGet} className="btn btn-secondary">Get</button>
              <button onClick={handleSharedDelete} className="btn btn-danger">Delete</button>
            </div>
          </div>

          {/* Scope restrictions notice */}
          <div className="web-section web-notice">
            <h2>Store Scope Restrictions</h2>
            <ul>
              <li><strong>application</strong> — available: shared across all instances in the account</li>
              <li><strong>shared(namespace)</strong> — available: cross-app data via namespace</li>
              <li><strong>instance</strong> — not available: no instance context in web</li>
              <li><strong>device</strong> — not available: no device context in web</li>
            </ul>
          </div>
        </div>

        <div className="web-logger">
          <Logger logs={logs} onClear={() => setLogs([])} />
        </div>
      </div>
    </div>
  )
}
