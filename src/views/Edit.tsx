import { useState, useEffect, useCallback } from 'react'
import { configure } from '@telemetryos/sdk'
import { name } from '~/telemetry.config.json'
import {
  sendStoreValue,
  getStoreValue,
  clearStoreValue,
  subscribeToStoreValue,
  unsubscribeFromStoreValue,
  sendSharedStoreValue,
  getSharedStoreValue,
  clearSharedStoreValue,
  subscribeToSharedStoreValue,
  unsubscribeFromSharedStoreValue,
} from '../services/sdk-store'
import { SdkStoreScope } from '../types'
import './Edit.css'

// Check if running in TelemetryOS environment
const urlParams = new URLSearchParams(window.location.search)
const hasApplicationInstance = urlParams.has('applicationInstance')

let sdkConfigured = false
if (hasApplicationInstance) {
  try {
    configure(name)
    sdkConfigured = true
  } catch (error) {
    console.error('Failed to configure SDK:', error)
  }
}

export function Edit() {
  // Form state
  const [scope, setScope] = useState<SdkStoreScope | 'shared'>('instance')
  const [namespace, setNamespace] = useState('test-namespace')
  const [key, setKey] = useState('config')
  const [value, setValue] = useState('')

  // Current value from store
  const [currentValue, setCurrentValue] = useState<any>(undefined)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Subscription callback
  const handleStoreUpdate = useCallback((newValue: any) => {
    console.log('Store update received:', newValue)
    setCurrentValue(newValue)
  }, [])

  // Load initial value and subscribe
  const loadAndSubscribe = useCallback(async () => {
    if (!sdkConfigured) {
      setError('SDK not configured. Run app via "telemetryos serve" command.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Unsubscribe from previous if any
      if (isSubscribed) {
        if (scope === 'shared') {
          await unsubscribeFromSharedStoreValue({ namespace, key, callback: handleStoreUpdate })
        } else {
          await unsubscribeFromStoreValue({ key, scope, callback: handleStoreUpdate })
        }
        setIsSubscribed(false)
      }

      // Load current value
      let loadedValue: any
      if (scope === 'shared') {
        loadedValue = await getSharedStoreValue({ namespace, key })
      } else {
        loadedValue = await getStoreValue({ key, scope })
      }
      setCurrentValue(loadedValue)

      // Subscribe for updates
      if (scope === 'shared') {
        await subscribeToSharedStoreValue({ namespace, key, callback: handleStoreUpdate })
      } else {
        await subscribeToStoreValue({ key, scope, callback: handleStoreUpdate })
      }
      setIsSubscribed(true)

    } catch (err: any) {
      console.error('Failed to load/subscribe:', err)
      setError(err.message || 'Failed to load value')
    } finally {
      setIsLoading(false)
    }
  }, [scope, namespace, key, isSubscribed, handleStoreUpdate])

  // Load on mount and when key/scope changes
  useEffect(() => {
    loadAndSubscribe()

    // Cleanup on unmount
    return () => {
      if (sdkConfigured && isSubscribed) {
        if (scope === 'shared') {
          unsubscribeFromSharedStoreValue({ namespace, key, callback: handleStoreUpdate }).catch(console.error)
        } else {
          unsubscribeFromStoreValue({ key, scope, callback: handleStoreUpdate }).catch(console.error)
        }
      }
    }
  }, []) // Only on mount

  // Handle form submit (save)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sdkConfigured) {
      setError('SDK not configured')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (scope === 'shared') {
        await sendSharedStoreValue({ namespace, key, value })
      } else {
        await sendStoreValue({ key, value, scope })
      }
      setSuccessMessage('Value saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error('Failed to save:', err)
      setError(err.message || 'Failed to save value')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!sdkConfigured) {
      setError('SDK not configured')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (scope === 'shared') {
        await clearSharedStoreValue({ namespace, key })
      } else {
        await clearStoreValue({ key, scope })
      }
      setSuccessMessage('Value deleted successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error('Failed to delete:', err)
      setError(err.message || 'Failed to delete value')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle reload (re-fetch and re-subscribe)
  const handleReload = () => {
    loadAndSubscribe()
  }

  return (
    <div className="edit">
      <div className="edit-header">
        <h1>TelemetryOS SDK - Settings</h1>
        <p className="edit-subtitle">Configure and manage store values</p>
      </div>

      {!sdkConfigured && (
        <div className="edit-warning">
          <strong>SDK not configured.</strong> Run app via <code>telemetryos serve</code> command.
        </div>
      )}

      <div className="edit-container">
        {/* Current Value Display */}
        <div className="edit-section">
          <h2>Current Value</h2>
          <div className="current-value-display">
            <div className="current-value-header">
              <span className="current-value-key">
                {scope === 'shared' ? `${namespace}/${key}` : `${scope}/${key}`}
              </span>
              {isSubscribed && <span className="subscribed-badge">Subscribed</span>}
            </div>
            <div className="current-value-content">
              {isLoading ? (
                <span className="loading">Loading...</span>
              ) : currentValue !== undefined ? (
                <pre>{JSON.stringify(currentValue, null, 2)}</pre>
              ) : (
                <span className="empty-value">(empty)</span>
              )}
            </div>
            <button onClick={handleReload} className="btn-reload" disabled={isLoading}>
              Reload
            </button>
          </div>
        </div>

        {/* Form Section */}
        <div className="edit-section">
          <h2>Set Value</h2>
          <form onSubmit={handleSubmit} className="edit-form">
            {/* Scope Selector */}
            <div className="form-group">
              <label htmlFor="scope">Store Scope</label>
              <select
                id="scope"
                value={scope}
                onChange={(e) => setScope(e.target.value as SdkStoreScope | 'shared')}
                className="form-select"
              >
                <option value="instance">Instance (this app instance only)</option>
                <option value="application">Application (all instances in account)</option>
                <option value="device">Device (this device only)</option>
                <option value="shared">Shared (cross-app via namespace)</option>
              </select>
            </div>

            {/* Namespace (only for shared scope) */}
            {scope === 'shared' && (
              <div className="form-group">
                <label htmlFor="namespace">Namespace</label>
                <input
                  id="namespace"
                  type="text"
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                  placeholder="e.g., my-shared-data"
                  className="form-input"
                  required
                />
              </div>
            )}

            {/* Key */}
            <div className="form-group">
              <label htmlFor="key">Key</label>
              <input
                id="key"
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g., config, settings, userData"
                className="form-input"
                required
              />
            </div>

            {/* Value */}
            <div className="form-group">
              <label htmlFor="value">Value</label>
              <textarea
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter value (string, JSON, etc.)"
                className="form-textarea"
                rows={4}
              />
            </div>

            {/* Error/Success Messages */}
            {error && <div className="message error-message">{error}</div>}
            {successMessage && <div className="message success-message">{successMessage}</div>}

            {/* Buttons */}
            <div className="form-buttons">
              <button type="submit" className="btn-submit" disabled={isLoading || !key}>
                {isLoading ? 'Saving...' : 'Save Value'}
              </button>
              <button type="button" onClick={handleDelete} className="btn-delete" disabled={isLoading || !key}>
                Delete
              </button>
            </div>
          </form>
        </div>

        {/* Scope Info */}
        <div className="edit-section scope-info">
          <h2>Store Scopes</h2>
          <ul>
            <li>
              <strong>Instance:</strong> Data specific to this application instance. Shared between render and settings views of the same instance.
            </li>
            <li>
              <strong>Application:</strong> Data shared across all instances of this application within the account.
            </li>
            <li>
              <strong>Device:</strong> Data stored locally on this device only. Not synced.
            </li>
            <li>
              <strong>Shared:</strong> Data shared between different applications via a common namespace.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
