import { useState, useEffect, useCallback, useRef } from 'react'
import { store, globalClient } from '@telemetryos/sdk'
import { LogEntry } from '../types'
import './WorkerTest.css'

interface WorkerLogEntry {
  timestamp: string
  message: string
  data?: any
  tickCount: number
  isRunning: boolean
}

interface WorkerTestProps {
  onLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void
}

export function WorkerTest({ onLog }: WorkerTestProps) {
  const [workerLogs, setWorkerLogs] = useState<WorkerLogEntry[]>([])
  const [latestStatus, setLatestStatus] = useState<WorkerLogEntry | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')

  // Use ref to avoid re-subscriptions when onLog changes
  const onLogRef = useRef(onLog)
  onLogRef.current = onLog

  // Stable handler that doesn't change
  const handleWorkerState = useCallback((value: string) => {
    console.log('[WorkerTest] Received worker_state update:', value)
    if (!value) {
      console.log('[WorkerTest] Empty value received')
      return
    }
    try {
      const logEntry = JSON.parse(value) as WorkerLogEntry

      setLatestStatus(logEntry)
      setWorkerLogs((prev) => [logEntry, ...prev].slice(0, 10))

      onLogRef.current({
        level: 'info',
        method: 'worker.state',
        message: logEntry.message,
        data: logEntry.data,
      })
    } catch (error) {
      console.error('[WorkerTest] Failed to parse worker state:', error, value)
    }
  }, []) // No dependencies - uses ref for onLog

  // Subscribe to worker state from store - runs only once
  useEffect(() => {
    const client = globalClient()
    if (!client) {
      const msg = 'SDK not configured. Run app via "telemetryos serve" command.'
      console.error('[WorkerTest]', msg)
      setDebugInfo(msg)
      onLogRef.current({
        level: 'error',
        method: 'Worker',
        message: msg,
        data: { hint: 'Missing applicationInstance query parameter' },
      })
      return
    }

    // Log debug info about current client
    const clientInfo = `applicationInstance: ${client.applicationInstance}, applicationSpecifier: ${client.applicationSpecifier}`
    console.log('[WorkerTest] SDK client info:', clientInfo)
    setDebugInfo(clientInfo)

    let mounted = true
    let handlerRef = handleWorkerState

    const initSubscription = async () => {
      try {
        console.log('[WorkerTest] Getting initial worker_state...')
        // Get initial state
        const stateValue = await store().instance.get('worker_state')
        console.log('[WorkerTest] Initial worker_state:', stateValue)

        if (mounted && stateValue) {
          handleWorkerState(stateValue)
        }

        console.log('[WorkerTest] Subscribing to worker_state...')
        // Subscribe to updates
        const result = await store().instance.subscribe('worker_state', handlerRef)
        console.log('[WorkerTest] Subscribe result:', result)

        if (mounted) {
          setIsSubscribed(true)
          onLogRef.current({
            level: 'success',
            method: 'worker.subscribe',
            message: 'Subscribed to background worker updates',
            data: { subscribeResult: result },
          })
        }
      } catch (error: any) {
        console.error('[WorkerTest] Subscription error:', error)
        onLogRef.current({
          level: 'error',
          method: 'worker.subscribe',
          message: `Failed to subscribe: ${error.message}`,
          data: { error: error.message },
        })
      }
    }

    initSubscription()

    return () => {
      console.log('[WorkerTest] Cleaning up subscription')
      mounted = false
      store().instance.unsubscribe('worker_state', handlerRef).catch(console.error)
    }
  }, [handleWorkerState]) // Only depends on stable handleWorkerState

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString()
    } catch {
      return isoString
    }
  }

  return (
    <div className="worker-test">
      <h2>Background Worker Test</h2>
      <p className="worker-test-description">
        The background worker is started automatically by TelemetryOS and reports progress via the store.
        The UI subscribes to updates - no manual worker creation needed.
      </p>

      {/* Debug Info */}
      {debugInfo && (
        <div className="worker-debug-section" style={{ background: '#f0f0f0', padding: '8px', marginBottom: '16px', fontSize: '12px', fontFamily: 'monospace' }}>
          <strong>Debug:</strong> {debugInfo}
        </div>
      )}

      {/* Worker Status */}
      <div className="worker-status-section">
        <h3>Worker Status</h3>
        {latestStatus ? (
          <div className="worker-status-info">
            <div className="status-item">
              <span className="status-label">Status:</span>
              <span className={`status-value ${latestStatus.isRunning ? 'running' : 'paused'}`}>
                {latestStatus.isRunning ? 'Running' : 'Paused'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Tick Count:</span>
              <span className="status-value">{latestStatus.tickCount}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Last Update:</span>
              <span className="status-value">{formatTime(latestStatus.timestamp)}</span>
            </div>
          </div>
        ) : (
          <div className="worker-status-placeholder">
            Waiting for worker status...
          </div>
        )}
        {isSubscribed && <div className="subscription-indicator">Subscribed to worker updates</div>}
      </div>

      {/* Worker Logs */}
      <div className="worker-logs-section">
        <h3>Worker Logs</h3>
        <div className="worker-logs-container">
          {workerLogs.length > 0 ? (
            workerLogs.map((log, index) => (
              <div key={`${log.timestamp}-${index}`} className="worker-log-entry">
                <span className="log-time">{formatTime(log.timestamp)}</span>
                <span className="log-tick">#{log.tickCount}</span>
                <span className="log-message">{log.message}</span>
                {log.data && (
                  <span className="log-data">{JSON.stringify(log.data)}</span>
                )}
              </div>
            ))
          ) : (
            <div className="worker-logs-placeholder">
              No worker logs yet. Worker will start reporting when running.
            </div>
          )}
        </div>
      </div>

      {/* Worker Code Reference */}
      <div className="worker-code-section">
        <h3>Worker Code</h3>
        <p className="worker-code-info">
          The background worker is located at: <code>src/workers/background.ts</code>
        </p>
        <pre className="worker-code-preview">
{`// Background worker performs tasks every 10 seconds:
// - Checking system health
// - Syncing data
// - Processing queue
// - Cleaning up cache
// - Updating metrics

// It reports progress via store (1 request per tick):
await store().instance.set('worker_state', JSON.stringify(state))`}
        </pre>
      </div>
    </div>
  )
}
