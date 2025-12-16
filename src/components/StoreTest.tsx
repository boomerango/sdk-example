import { useState, useCallback, useRef } from 'react'
import { configure, globalClient } from '@telemetryos/sdk'
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
import { LogEntry } from '../types'
import './StoreTest.css'

// Check if running in TelemetryOS environment (has required query params)
const urlParams = new URLSearchParams(window.location.search)
const hasApplicationInstance = urlParams.has('applicationInstance')

function ensureSdkConfigured(): boolean {
  if (globalClient()) return true
  if (!hasApplicationInstance) {
    console.warn('SDK not configured: Missing applicationInstance query parameter.')
    return false
  }
  try {
    configure(name)
    return true
  } catch (error) {
    console.error('Failed to configure SDK:', error)
    return false
  }
}

interface StoreTestProps {
  onLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void
}

export function StoreTest({ onLog }: StoreTestProps) {
  // Input values for setting
  const [applicationInputValue, setApplicationInputValue] = useState('')
  const [applicationKey, setApplicationKey] = useState('testKey')
  const [instanceInputValue, setInstanceInputValue] = useState('')
  const [instanceKey, setInstanceKey] = useState('testKey')
  const [deviceInputValue, setDeviceInputValue] = useState('')
  const [deviceKey, setDeviceKey] = useState('testKey')
  const [sharedInputValue, setSharedInputValue] = useState('')
  const [sharedKey, setSharedKey] = useState('testKey')
  const [sharedNamespace, setSharedNamespace] = useState('test-namespace')

  // Current values from store (updated via subscription)
  const [applicationCurrentValue, setApplicationCurrentValue] = useState<any>(undefined)
  const [instanceCurrentValue, setInstanceCurrentValue] = useState<any>(undefined)
  const [deviceCurrentValue, setDeviceCurrentValue] = useState<any>(undefined)
  const [sharedCurrentValue, setSharedCurrentValue] = useState<any>(undefined)

  // Subscription status
  const [applicationSubscribed, setApplicationSubscribed] = useState(false)
  const [instanceSubscribed, setInstanceSubscribed] = useState(false)
  const [deviceSubscribed, setDeviceSubscribed] = useState(false)
  const [sharedSubscribed, setSharedSubscribed] = useState(false)

  // Named callback functions for subscriptions (must be stable references)
  const handleApplicationUpdate = useCallback((value: any) => {
    console.log('Application store update:', value)
    setApplicationCurrentValue(value)
    onLog({
      level: 'info',
      method: 'store().application.subscribe',
      message: `Received update from subscription`,
      data: { value },
    })
  }, [onLog])

  const handleInstanceUpdate = useCallback((value: any) => {
    console.log('Instance store update:', value)
    setInstanceCurrentValue(value)
    onLog({
      level: 'info',
      method: 'store().instance.subscribe',
      message: `Received update from subscription`,
      data: { value },
    })
  }, [onLog])

  const handleDeviceUpdate = useCallback((value: any) => {
    console.log('Device store update:', value)
    setDeviceCurrentValue(value)
    onLog({
      level: 'info',
      method: 'store().device.subscribe',
      message: `Received update from subscription`,
      data: { value },
    })
  }, [onLog])

  const handleSharedUpdate = useCallback((value: any) => {
    console.log('Shared store update:', value)
    setSharedCurrentValue(value)
    onLog({
      level: 'info',
      method: 'store().shared.subscribe',
      message: `Received update from subscription`,
      data: { value },
    })
  }, [onLog])

  // Track subscription callbacks for cleanup
  const applicationCallbackRef = useRef<typeof handleApplicationUpdate | null>(null)
  const instanceCallbackRef = useRef<typeof handleInstanceUpdate | null>(null)
  const deviceCallbackRef = useRef<typeof handleDeviceUpdate | null>(null)
  const sharedCallbackRef = useRef<typeof handleSharedUpdate | null>(null)

  // Application Store Methods
  const testApplicationSet = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().application.set', message: 'SDK not configured', data: {} })
      return
    }
    try {
      const result = await sendStoreValue({ key: applicationKey, value: applicationInputValue, scope: 'application' })
      onLog({
        level: 'success',
        method: 'store().application.set',
        message: `Set application store value`,
        data: { key: applicationKey, value: applicationInputValue, result },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().application.set',
        message: `Failed to set application store value: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testApplicationGet = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().application.get', message: 'SDK not configured', data: {} })
      return
    }
    try {
      const value = await getStoreValue({ key: applicationKey, scope: 'application' })
      setApplicationCurrentValue(value)
      onLog({
        level: 'success',
        method: 'store().application.get',
        message: `Retrieved application store value`,
        data: { key: applicationKey, value },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().application.get',
        message: `Failed to get application store value: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testApplicationDelete = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().application.delete', message: 'SDK not configured', data: {} })
      return
    }
    try {
      const result = await clearStoreValue({ key: applicationKey, scope: 'application' })
      onLog({
        level: 'success',
        method: 'store().application.delete',
        message: `Deleted application store key`,
        data: { key: applicationKey, result },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().application.delete',
        message: `Failed to delete: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testApplicationSubscribe = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().application.subscribe', message: 'SDK not configured', data: {} })
      return
    }
    if (applicationSubscribed) {
      onLog({ level: 'info', method: 'store().application.subscribe', message: 'Already subscribed', data: {} })
      return
    }
    try {
      applicationCallbackRef.current = handleApplicationUpdate
      await subscribeToStoreValue({ key: applicationKey, scope: 'application', callback: handleApplicationUpdate })
      setApplicationSubscribed(true)
      onLog({
        level: 'success',
        method: 'store().application.subscribe',
        message: `Subscribed to "${applicationKey}"`,
        data: { key: applicationKey },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().application.subscribe',
        message: `Failed to subscribe: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testApplicationUnsubscribe = async () => {
    if (!applicationSubscribed || !applicationCallbackRef.current) {
      onLog({ level: 'info', method: 'store().application.unsubscribe', message: 'Not subscribed', data: {} })
      return
    }
    try {
      await unsubscribeFromStoreValue({ key: applicationKey, scope: 'application', callback: applicationCallbackRef.current })
      applicationCallbackRef.current = null
      setApplicationSubscribed(false)
      onLog({
        level: 'success',
        method: 'store().application.unsubscribe',
        message: `Unsubscribed from "${applicationKey}"`,
        data: { key: applicationKey },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().application.unsubscribe',
        message: `Failed to unsubscribe: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  // Instance Store Methods
  const testInstanceSet = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().instance.set', message: 'SDK not configured', data: {} })
      return
    }
    try {
      const result = await sendStoreValue({ key: instanceKey, value: instanceInputValue, scope: 'instance' })
      onLog({
        level: 'success',
        method: 'store().instance.set',
        message: `Set instance store value`,
        data: { key: instanceKey, value: instanceInputValue, result },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().instance.set',
        message: `Failed to set instance store value: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testInstanceGet = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().instance.get', message: 'SDK not configured', data: {} })
      return
    }
    try {
      const value = await getStoreValue({ key: instanceKey, scope: 'instance' })
      setInstanceCurrentValue(value)
      onLog({
        level: 'success',
        method: 'store().instance.get',
        message: `Retrieved instance store value`,
        data: { key: instanceKey, value },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().instance.get',
        message: `Failed to get instance store value: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testInstanceDelete = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().instance.delete', message: 'SDK not configured', data: {} })
      return
    }
    try {
      const result = await clearStoreValue({ key: instanceKey, scope: 'instance' })
      onLog({
        level: 'success',
        method: 'store().instance.delete',
        message: `Deleted instance store key`,
        data: { key: instanceKey, result },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().instance.delete',
        message: `Failed to delete: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testInstanceSubscribe = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().instance.subscribe', message: 'SDK not configured', data: {} })
      return
    }
    if (instanceSubscribed) {
      onLog({ level: 'info', method: 'store().instance.subscribe', message: 'Already subscribed', data: {} })
      return
    }
    try {
      instanceCallbackRef.current = handleInstanceUpdate
      await subscribeToStoreValue({ key: instanceKey, scope: 'instance', callback: handleInstanceUpdate })
      setInstanceSubscribed(true)
      onLog({
        level: 'success',
        method: 'store().instance.subscribe',
        message: `Subscribed to "${instanceKey}"`,
        data: { key: instanceKey },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().instance.subscribe',
        message: `Failed to subscribe: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testInstanceUnsubscribe = async () => {
    if (!instanceSubscribed || !instanceCallbackRef.current) {
      onLog({ level: 'info', method: 'store().instance.unsubscribe', message: 'Not subscribed', data: {} })
      return
    }
    try {
      await unsubscribeFromStoreValue({ key: instanceKey, scope: 'instance', callback: instanceCallbackRef.current })
      instanceCallbackRef.current = null
      setInstanceSubscribed(false)
      onLog({
        level: 'success',
        method: 'store().instance.unsubscribe',
        message: `Unsubscribed from "${instanceKey}"`,
        data: { key: instanceKey },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().instance.unsubscribe',
        message: `Failed to unsubscribe: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  // Device Store Methods
  const testDeviceSet = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().device.set', message: 'SDK not configured', data: {} })
      return
    }
    try {
      const result = await sendStoreValue({ key: deviceKey, value: deviceInputValue, scope: 'device' })
      onLog({
        level: 'success',
        method: 'store().device.set',
        message: `Set device store value`,
        data: { key: deviceKey, value: deviceInputValue, result },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().device.set',
        message: `Failed to set device store value: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testDeviceGet = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().device.get', message: 'SDK not configured', data: {} })
      return
    }
    try {
      const value = await getStoreValue({ key: deviceKey, scope: 'device' })
      setDeviceCurrentValue(value)
      onLog({
        level: 'success',
        method: 'store().device.get',
        message: `Retrieved device store value`,
        data: { key: deviceKey, value },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().device.get',
        message: `Failed to get device store value: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testDeviceDelete = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().device.delete', message: 'SDK not configured', data: {} })
      return
    }
    try {
      const result = await clearStoreValue({ key: deviceKey, scope: 'device' })
      onLog({
        level: 'success',
        method: 'store().device.delete',
        message: `Deleted device store key`,
        data: { key: deviceKey, result },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().device.delete',
        message: `Failed to delete: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testDeviceSubscribe = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().device.subscribe', message: 'SDK not configured', data: {} })
      return
    }
    if (deviceSubscribed) {
      onLog({ level: 'info', method: 'store().device.subscribe', message: 'Already subscribed', data: {} })
      return
    }
    try {
      deviceCallbackRef.current = handleDeviceUpdate
      await subscribeToStoreValue({ key: deviceKey, scope: 'device', callback: handleDeviceUpdate })
      setDeviceSubscribed(true)
      onLog({
        level: 'success',
        method: 'store().device.subscribe',
        message: `Subscribed to "${deviceKey}"`,
        data: { key: deviceKey },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().device.subscribe',
        message: `Failed to subscribe: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testDeviceUnsubscribe = async () => {
    if (!deviceSubscribed || !deviceCallbackRef.current) {
      onLog({ level: 'info', method: 'store().device.unsubscribe', message: 'Not subscribed', data: {} })
      return
    }
    try {
      await unsubscribeFromStoreValue({ key: deviceKey, scope: 'device', callback: deviceCallbackRef.current })
      deviceCallbackRef.current = null
      setDeviceSubscribed(false)
      onLog({
        level: 'success',
        method: 'store().device.unsubscribe',
        message: `Unsubscribed from "${deviceKey}"`,
        data: { key: deviceKey },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().device.unsubscribe',
        message: `Failed to unsubscribe: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  // Shared Store Methods
  const testSharedSet = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().shared.set', message: 'SDK not configured', data: {} })
      return
    }
    try {
      const result = await sendSharedStoreValue({ namespace: sharedNamespace, key: sharedKey, value: sharedInputValue })
      onLog({
        level: 'success',
        method: 'store().shared.set',
        message: `Set shared store value`,
        data: { namespace: sharedNamespace, key: sharedKey, value: sharedInputValue, result },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().shared.set',
        message: `Failed to set shared store value: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testSharedGet = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().shared.get', message: 'SDK not configured', data: {} })
      return
    }
    try {
      const value = await getSharedStoreValue({ namespace: sharedNamespace, key: sharedKey })
      setSharedCurrentValue(value)
      onLog({
        level: 'success',
        method: 'store().shared.get',
        message: `Retrieved shared store value`,
        data: { namespace: sharedNamespace, key: sharedKey, value },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().shared.get',
        message: `Failed to get shared store value: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testSharedDelete = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().shared.delete', message: 'SDK not configured', data: {} })
      return
    }
    try {
      const result = await clearSharedStoreValue({ namespace: sharedNamespace, key: sharedKey })
      onLog({
        level: 'success',
        method: 'store().shared.delete',
        message: `Deleted shared store key`,
        data: { namespace: sharedNamespace, key: sharedKey, result },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().shared.delete',
        message: `Failed to delete: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testSharedSubscribe = async () => {
    if (!ensureSdkConfigured()) {
      onLog({ level: 'error', method: 'store().shared.subscribe', message: 'SDK not configured', data: {} })
      return
    }
    if (sharedSubscribed) {
      onLog({ level: 'info', method: 'store().shared.subscribe', message: 'Already subscribed', data: {} })
      return
    }
    try {
      sharedCallbackRef.current = handleSharedUpdate
      await subscribeToSharedStoreValue({ namespace: sharedNamespace, key: sharedKey, callback: handleSharedUpdate })
      setSharedSubscribed(true)
      onLog({
        level: 'success',
        method: 'store().shared.subscribe',
        message: `Subscribed to "${sharedNamespace}/${sharedKey}"`,
        data: { namespace: sharedNamespace, key: sharedKey },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().shared.subscribe',
        message: `Failed to subscribe: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  const testSharedUnsubscribe = async () => {
    if (!sharedSubscribed || !sharedCallbackRef.current) {
      onLog({ level: 'info', method: 'store().shared.unsubscribe', message: 'Not subscribed', data: {} })
      return
    }
    try {
      await unsubscribeFromSharedStoreValue({ namespace: sharedNamespace, key: sharedKey, callback: sharedCallbackRef.current })
      sharedCallbackRef.current = null
      setSharedSubscribed(false)
      onLog({
        level: 'success',
        method: 'store().shared.unsubscribe',
        message: `Unsubscribed from "${sharedNamespace}/${sharedKey}"`,
        data: { namespace: sharedNamespace, key: sharedKey },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'store().shared.unsubscribe',
        message: `Failed to unsubscribe: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  return (
    <div className="store-test">
      <h2>Store API Tests</h2>
      <p className="store-test-description">
        Click buttons to interact with the store. Use Subscribe to receive real-time updates.
      </p>

      {/* Application Store */}
      <div className="store-test-section">
        <h3>Application Store</h3>
        <p className="store-test-info">Shared across all instances within an account</p>
        <div className="store-current-value">
          <strong>Current value:</strong> {applicationCurrentValue !== undefined ? JSON.stringify(applicationCurrentValue) : '(empty)'}
        </div>
        <div className="store-test-input-group">
          <input
            type="text"
            value={applicationKey}
            onChange={(e) => setApplicationKey(e.target.value)}
            placeholder="Key"
            className="store-test-input"
          />
          <input
            type="text"
            value={applicationInputValue}
            onChange={(e) => setApplicationInputValue(e.target.value)}
            placeholder="Value to set"
            className="store-test-input"
          />
        </div>
        <div className="store-test-buttons">
          <button onClick={testApplicationSet} className="btn btn-primary">Set</button>
          <button onClick={testApplicationGet} className="btn btn-secondary">Get</button>
          <button onClick={testApplicationDelete} className="btn btn-danger">Delete</button>
          {!applicationSubscribed ? (
            <button onClick={testApplicationSubscribe} className="btn btn-success">Subscribe</button>
          ) : (
            <button onClick={testApplicationUnsubscribe} className="btn btn-warning">Unsubscribe</button>
          )}
        </div>
        {applicationSubscribed && <div className="subscription-indicator">✓ Subscribed</div>}
      </div>

      {/* Instance Store */}
      <div className="store-test-section">
        <h3>Instance Store</h3>
        <p className="store-test-info">Specific to the current application instance</p>
        <div className="store-current-value">
          <strong>Current value:</strong> {instanceCurrentValue !== undefined ? JSON.stringify(instanceCurrentValue) : '(empty)'}
        </div>
        <div className="store-test-input-group">
          <input
            type="text"
            value={instanceKey}
            onChange={(e) => setInstanceKey(e.target.value)}
            placeholder="Key"
            className="store-test-input"
          />
          <input
            type="text"
            value={instanceInputValue}
            onChange={(e) => setInstanceInputValue(e.target.value)}
            placeholder="Value to set"
            className="store-test-input"
          />
        </div>
        <div className="store-test-buttons">
          <button onClick={testInstanceSet} className="btn btn-primary">Set</button>
          <button onClick={testInstanceGet} className="btn btn-secondary">Get</button>
          <button onClick={testInstanceDelete} className="btn btn-danger">Delete</button>
          {!instanceSubscribed ? (
            <button onClick={testInstanceSubscribe} className="btn btn-success">Subscribe</button>
          ) : (
            <button onClick={testInstanceUnsubscribe} className="btn btn-warning">Unsubscribe</button>
          )}
        </div>
        {instanceSubscribed && <div className="subscription-indicator">✓ Subscribed</div>}
      </div>

      {/* Device Store */}
      <div className="store-test-section">
        <h3>Device Store</h3>
        <p className="store-test-info">Only available on the current device</p>
        <div className="store-current-value">
          <strong>Current value:</strong> {deviceCurrentValue !== undefined ? JSON.stringify(deviceCurrentValue) : '(empty)'}
        </div>
        <div className="store-test-input-group">
          <input
            type="text"
            value={deviceKey}
            onChange={(e) => setDeviceKey(e.target.value)}
            placeholder="Key"
            className="store-test-input"
          />
          <input
            type="text"
            value={deviceInputValue}
            onChange={(e) => setDeviceInputValue(e.target.value)}
            placeholder="Value to set"
            className="store-test-input"
          />
        </div>
        <div className="store-test-buttons">
          <button onClick={testDeviceSet} className="btn btn-primary">Set</button>
          <button onClick={testDeviceGet} className="btn btn-secondary">Get</button>
          <button onClick={testDeviceDelete} className="btn btn-danger">Delete</button>
          {!deviceSubscribed ? (
            <button onClick={testDeviceSubscribe} className="btn btn-success">Subscribe</button>
          ) : (
            <button onClick={testDeviceUnsubscribe} className="btn btn-warning">Unsubscribe</button>
          )}
        </div>
        {deviceSubscribed && <div className="subscription-indicator">✓ Subscribed</div>}
      </div>

      {/* Shared Store */}
      <div className="store-test-section">
        <h3>Shared Store</h3>
        <p className="store-test-info">Shared between different applications via namespace</p>
        <div className="store-current-value">
          <strong>Current value:</strong> {sharedCurrentValue !== undefined ? JSON.stringify(sharedCurrentValue) : '(empty)'}
        </div>
        <div className="store-test-input-group">
          <input
            type="text"
            value={sharedNamespace}
            onChange={(e) => setSharedNamespace(e.target.value)}
            placeholder="Namespace"
            className="store-test-input"
          />
          <input
            type="text"
            value={sharedKey}
            onChange={(e) => setSharedKey(e.target.value)}
            placeholder="Key"
            className="store-test-input"
          />
          <input
            type="text"
            value={sharedInputValue}
            onChange={(e) => setSharedInputValue(e.target.value)}
            placeholder="Value to set"
            className="store-test-input"
          />
        </div>
        <div className="store-test-buttons">
          <button onClick={testSharedSet} className="btn btn-primary">Set</button>
          <button onClick={testSharedGet} className="btn btn-secondary">Get</button>
          <button onClick={testSharedDelete} className="btn btn-danger">Delete</button>
          {!sharedSubscribed ? (
            <button onClick={testSharedSubscribe} className="btn btn-success">Subscribe</button>
          ) : (
            <button onClick={testSharedUnsubscribe} className="btn btn-warning">Unsubscribe</button>
          )}
        </div>
        {sharedSubscribed && <div className="subscription-indicator">✓ Subscribed</div>}
      </div>
    </div>
  )
}
