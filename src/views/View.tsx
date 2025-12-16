import { useState, useEffect } from 'react'
import { configure, globalClient } from '@telemetryos/sdk'
import { StoreTest } from '../components/StoreTest'
import { ApiTest } from '../components/ApiTest'
import { WorkerTest } from '../components/WorkerTest'
import { Logger } from '../components/Logger'
import { LogEntry } from '../types'
import './View.css'

const APP_NAME = 'example_sdk_app'

export function View() {
  const [sdkReady, setSdkReady] = useState(false)
  const [sdkError, setSdkError] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  // Configure SDK on mount
  useEffect(() => {
    if (globalClient()) {
      setSdkReady(true)
      return
    }

    const params = new URLSearchParams(window.location.search)
    const hasApplicationInstance = params.has('applicationInstance')

    if (!hasApplicationInstance) {
      setSdkError('Missing applicationInstance query parameter')
      return
    }

    try {
      configure(APP_NAME)
      setSdkReady(true)
    } catch (error) {
      setSdkError(error instanceof Error ? error.message : 'Failed to configure SDK')
    }
  }, [])
  const [showStoreTest, setShowStoreTest] = useState(false)
  const [showWorkerTest, setShowWorkerTest] = useState(false)

  const addLog = (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      ...log,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    }
    setLogs((prevLogs) => [newLog, ...prevLogs])
  }

  const clearLogs = () => {
    setLogs([])
  }

  if (sdkError) {
    return (
      <div className="view">
        <div className="view-header">
          <h1>TelemetryOS SDK Example - View</h1>
          <p className="view-error">SDK Error: {sdkError}</p>
        </div>
      </div>
    )
  }

  if (!sdkReady) {
    return (
      <div className="view">
        <div className="view-header">
          <h1>TelemetryOS SDK Example - View</h1>
          <p className="view-subtitle">Initializing SDK...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="view">
      <div className="view-header">
        <h1>TelemetryOS SDK Example - View</h1>
        <p className="view-subtitle">
          Testing SDK functionality in the render/view mount point
        </p>
      </div>

      <div className="view-content">
        <div className="view-tests">
          <div className="test-toggles">
            <button onClick={() => setShowStoreTest(!showStoreTest)}>
              {showStoreTest ? 'Hide' : 'Show'} Store Test
            </button>
            <button onClick={() => setShowWorkerTest(!showWorkerTest)}>
              {showWorkerTest ? 'Hide' : 'Show'} Worker Test
            </button>
          </div>
          {showStoreTest && <StoreTest onLog={addLog} />}
          <ApiTest onLog={addLog} />
          {showWorkerTest && <WorkerTest onLog={addLog} />}
        </div>
        <div className="view-logger">
          <Logger logs={logs} onClear={clearLogs} />
        </div>
      </div>
    </div>
  )
}

