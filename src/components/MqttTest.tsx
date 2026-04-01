import { useState, useRef } from 'react'
import { mqtt } from '@telemetryos/sdk'
import type { MqttMessage, MqttConnectionStatus } from '@telemetryos/root-sdk'
import { LogEntry } from '../types'
import './MqttTest.css'

interface MqttTestProps {
  onLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void
}

export function MqttTest({ onLog }: MqttTestProps) {
  const [brokerUrl, setBrokerUrl] = useState('mqtt://192.168.0.162:1883')
  const [clientId, setClientId] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<MqttConnectionStatus | ''>('')
  const [topic, setTopic] = useState('test/hello')
  const [payload, setPayload] = useState('{"ts": 0}')
  const [qos, setQos] = useState<0 | 1 | 2>(0)
  const [retain, setRetain] = useState(false)
  const [subscribeTopic, setSubscribeTopic] = useState('test/#')

  const subscribeHandlerRef = useRef<((msg: MqttMessage) => void) | null>(null)
  const statusHandlerRef = useRef<((status: MqttConnectionStatus) => void) | null>(null)

  // Connect
  const handleConnect = async () => {
    try {
      const id = await mqtt().connect(brokerUrl, { keepalive: 30, clean: true })
      setClientId(id)
      onLog({
        level: 'success',
        method: 'mqtt().connect',
        message: `Connected to ${brokerUrl}`,
        data: { clientId: id },
      })

      // Subscribe to connection status changes
      const statusHandler = (status: MqttConnectionStatus) => {
        setConnectionStatus(status)
        onLog({
          level: status === 'error' ? 'error' : 'info',
          method: 'mqtt().subscribeConnectionStatus',
          message: `Connection status changed: ${status}`,
          data: { clientId: id, status },
        })
      }
      statusHandlerRef.current = statusHandler
      await mqtt().subscribeConnectionStatus(id, statusHandler)

      const status = await mqtt().getConnectionStatus(id)
      setConnectionStatus(status)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'mqtt().connect',
        message: `Failed to connect: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  // Disconnect
  const handleDisconnect = async () => {
    if (!clientId) {
      onLog({ level: 'error', method: 'mqtt().disconnect', message: 'No active connection (connect first)' })
      return
    }
    try {
      await mqtt().disconnect(clientId)
      setClientId('')
      setConnectionStatus('')
      subscribeHandlerRef.current = null
      statusHandlerRef.current = null
      onLog({
        level: 'success',
        method: 'mqtt().disconnect',
        message: `Disconnected`,
        data: { clientId },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'mqtt().disconnect',
        message: `Failed to disconnect: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  // Publish
  const handlePublish = async () => {
    if (!clientId) {
      onLog({ level: 'error', method: 'mqtt().publish', message: 'No active connection (connect first)' })
      return
    }
    try {
      const finalPayload = topic === 'test/hello'
        ? JSON.stringify({ ts: Date.now() })
        : payload
      await mqtt().publish(clientId, topic, finalPayload, { qos, retain })
      onLog({
        level: 'success',
        method: 'mqtt().publish',
        message: `Published to ${topic}`,
        data: { topic, payload: finalPayload, qos, retain },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'mqtt().publish',
        message: `Failed to publish: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  // Subscribe
  const handleSubscribe = async () => {
    if (!clientId) {
      onLog({ level: 'error', method: 'mqtt().subscribe', message: 'No active connection (connect first)' })
      return
    }
    try {
      const handler = (msg: MqttMessage) => {
        onLog({
          level: 'info',
          method: 'mqtt().subscribe [message]',
          message: `Message on ${msg.topic}`,
          data: { topic: msg.topic, payload: msg.payload, qos: msg.qos, retain: msg.retain },
        })
      }
      subscribeHandlerRef.current = handler
      await mqtt().subscribe(clientId, subscribeTopic, handler, { qos })
      onLog({
        level: 'success',
        method: 'mqtt().subscribe',
        message: `Subscribed to ${subscribeTopic}`,
        data: { clientId, topic: subscribeTopic, qos },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'mqtt().subscribe',
        message: `Failed to subscribe: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  // Unsubscribe
  const handleUnsubscribe = async () => {
    if (!clientId) {
      onLog({ level: 'error', method: 'mqtt().unsubscribe', message: 'No active connection (connect first)' })
      return
    }
    try {
      await mqtt().unsubscribe(clientId, subscribeTopic, subscribeHandlerRef.current ?? undefined)
      subscribeHandlerRef.current = null
      onLog({
        level: 'success',
        method: 'mqtt().unsubscribe',
        message: `Unsubscribed from ${subscribeTopic}`,
        data: { clientId, topic: subscribeTopic },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'mqtt().unsubscribe',
        message: `Failed to unsubscribe: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  // Get connection status
  const handleGetStatus = async () => {
    if (!clientId) {
      onLog({ level: 'error', method: 'mqtt().getConnectionStatus', message: 'No active connection (connect first)' })
      return
    }
    try {
      const status = await mqtt().getConnectionStatus(clientId)
      setConnectionStatus(status)
      onLog({
        level: 'success',
        method: 'mqtt().getConnectionStatus',
        message: `Status: ${status}`,
        data: { clientId, status },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'mqtt().getConnectionStatus',
        message: `Failed to get status: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  // Discover brokers
  const handleDiscover = async () => {
    try {
      onLog({ level: 'info', method: 'mqtt().discover', message: 'Scanning for MQTT brokers via mDNS (5s)...' })
      const brokers = await mqtt().discover()
      onLog({
        level: brokers.length > 0 ? 'success' : 'warning',
        method: 'mqtt().discover',
        message: brokers.length > 0 ? `Found ${brokers.length} broker(s)` : 'No brokers found',
        data: { brokers },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'mqtt().discover',
        message: `Discover failed: ${error.message}`,
        data: { error: error.message },
      })
    }
  }

  return (
    <div className="mqtt-test">
      <h2>MQTT API</h2>
      <p className="mqtt-test-description">
        Tests MQTT broker connectivity via the Player-Program proxy. Only available on dedicated player devices.
      </p>

      {/* Connection status bar */}
      {clientId && (
        <div className={`mqtt-status-bar mqtt-status-${connectionStatus || 'unknown'}`}>
          <span className="mqtt-status-dot" />
          <span>
            <strong>{connectionStatus || 'unknown'}</strong> — clientId: <code>{clientId}</code>
          </span>
        </div>
      )}

      {/* Connect / Disconnect */}
      <div className="api-test-section">
        <h3>Connection</h3>
        <div className="api-test-input-group">
          <label>
            Broker URL
            <input
              className="api-test-input"
              value={brokerUrl}
              onChange={(e) => setBrokerUrl(e.target.value)}
              placeholder="mqtt://192.168.0.162:1883"
            />
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={handleConnect} disabled={!!clientId}>
            Connect
          </button>
          <button onClick={handleDisconnect} disabled={!clientId}>
            Disconnect
          </button>
          <button onClick={handleGetStatus} disabled={!clientId}>
            Get Status
          </button>
          <button onClick={handleDiscover}>
            Discover Brokers (mDNS)
          </button>
        </div>
      </div>

      {/* Publish */}
      <div className="api-test-section">
        <h3>Publish</h3>
        <p className="api-test-info">Sends a message to the broker. Requires active connection.</p>
        <div className="api-test-input-group">
          <label>
            Topic
            <input
              className="api-test-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="test/hello"
            />
          </label>
          <label>
            Payload
            <input
              className="api-test-input"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder='{"ts": 0}'
            />
          </label>
          <label>
            QoS
            <select
              className="api-test-input"
              value={qos}
              onChange={(e) => setQos(Number(e.target.value) as 0 | 1 | 2)}
            >
              <option value={0}>0 — At most once</option>
              <option value={1}>1 — At least once</option>
              <option value={2}>2 — Exactly once</option>
            </select>
          </label>
          <label className="mqtt-checkbox-label">
            <input
              type="checkbox"
              checked={retain}
              onChange={(e) => setRetain(e.target.checked)}
            />
            Retain
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={handlePublish} disabled={!clientId}>
            Publish
          </button>
        </div>
      </div>

      {/* Subscribe */}
      <div className="api-test-section">
        <h3>Subscribe</h3>
        <p className="api-test-info">Incoming messages appear in the log panel. Supports wildcards (+ and #).</p>
        <div className="api-test-input-group">
          <label>
            Topic Filter
            <input
              className="api-test-input"
              value={subscribeTopic}
              onChange={(e) => setSubscribeTopic(e.target.value)}
              placeholder="test/#"
            />
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={handleSubscribe} disabled={!clientId}>
            Subscribe
          </button>
          <button onClick={handleUnsubscribe} disabled={!clientId || !subscribeHandlerRef.current}>
            Unsubscribe
          </button>
        </div>
      </div>
    </div>
  )
}
