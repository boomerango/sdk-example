import { useState, useEffect, useCallback } from 'react'
import { configure, store } from '@telemetryos/sdk'
import { name } from '~/telemetry.config.json'
import { LogEntry } from '../types'
import './WorkerTest.css'

// Check if running in TelemetryOS environment
const urlParams = new URLSearchParams(window.location.search)
const hasApplicationInstance = urlParams.has('applicationInstance')

let sdkConfigured = false
if (hasApplicationInstance) {
  try {
    configure(name)
    sdkConfigured = true
  } catch {
    sdkConfigured = true
  }
}

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

  // Handler for worker state updates from store
  const handleWorkerState = useCallback((value: string) => {
    if (!value) return
    try {
      const logEntry = JSON.parse(value) as WorkerLogEntry

      setLatestStatus(logEntry)
      setWorkerLogs((prev) => [logEntry, ...prev].slice(0, 10))

      onLog({
        level: 'info',
        method: 'worker.state',
        message: logEntry.message,
        data: logEntry.data,
      })
    } catch (error) {
      console.error('Failed to parse worker state:', error)
    }
  }, [onLog])

  // Subscribe to worker state from store
  useEffect(() => {
    if (!sdkConfigured) {
      onLog({
        level: 'error',
        method: 'Worker',
        message: 'SDK not configured. Run app via "telemetryos serve" command.',
        data: { hint: 'Missing applicationInstance query parameter' },
      })
      return
    }

    let mounted = true

    const initSubscription = async () => {
      try {
        // Get initial state
        const stateValue = await store().instance.get('worker_state')
        if (mounted && stateValue) {
          handleWorkerState(stateValue)
        }

        // Subscribe to updates
        await store().instance.subscribe('worker_state', handleWorkerState)

        if (mounted) {
          setIsSubscribed(true)
          onLog({
            level: 'success',
            method: 'worker.subscribe',
            message: 'Subscribed to background worker updates',
            data: {},
          })
        }
      } catch (error: any) {
        onLog({
          level: 'error',
          method: 'worker.subscribe',
          message: `Failed to subscribe: ${error.message}`,
          data: { error: error.message },
        })
      }
    }

    initSubscription()

    return () => {
      mounted = false
      store().instance.unsubscribe('worker_state', handleWorkerState).catch(console.error)
    }
  }, [handleWorkerState, onLog])

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
