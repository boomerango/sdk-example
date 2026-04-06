import { useState } from 'react'
import { containers } from '@telemetryos/sdk'
import type { Container } from '@telemetryos/sdk'
import { LogEntry } from '../types'

interface ContainerTestProps {
  onLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void
}

export function ContainerTest({ onLog }: ContainerTestProps) {
  const [containerName, setContainerName] = useState('my-backend')
  const [containerList, setContainerList] = useState<Container[]>([])
  const [containerLogs, setContainerLogs] = useState<string[]>([])

  const handleList = async () => {
    try {
      const list = await containers().list()
      setContainerList(list)
      list.forEach((c) => {
        onLog({
          level: 'success',
          method: 'containers().list',
          message: JSON.stringify(c),
        })
      })
      if (list.length === 0) {
        onLog({
          level: 'info',
          method: 'containers().list',
          message: 'No containers found',
        })
      }
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'containers().list',
        message: error.message,
      })
    }
  }

  const handleRun = async () => {
    try {
      const status = await containers().run(containerName)
      onLog({
        level: 'success',
        method: 'containers().run',
        message: `Status: ${status}`,
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'containers().run',
        message: error.message,
      })
    }
  }

  const handleStop = async () => {
    try {
      const status = await containers().stop(containerName)
      onLog({
        level: 'success',
        method: 'containers().stop',
        message: `Status: ${status}`,
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'containers().stop',
        message: error.message,
      })
    }
  }

  const handleResume = async () => {
    try {
      const status = await containers().resume(containerName)
      onLog({
        level: 'success',
        method: 'containers().resume',
        message: `Status: ${status}`,
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'containers().resume',
        message: error.message,
      })
    }
  }

  const handleDelete = async () => {
    try {
      await containers().delete(containerName)
      onLog({
        level: 'success',
        method: 'containers().delete',
        message: `Container "${containerName}" deleted successfully`,
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'containers().delete',
        message: error.message,
      })
    }
  }

  const handleGetLogs = async () => {
    try {
      const logs = await containers().getLogs(containerName, { lines: 50 })
      setContainerLogs(logs)
      onLog({
        level: 'success',
        method: 'containers().getLogs',
        message: `Retrieved ${logs.length} log lines for "${containerName}"`,
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'containers().getLogs',
        message: error.message,
      })
    }
  }

  return (
    <div className="api-test">
      <h2>Container Management</h2>
      <p className="api-test-description">
        Manage Docker containers running alongside the application (device-only)
      </p>

      <div className="api-test-section">
        <div className="api-test-buttons">
          <button onClick={handleList}>List Containers</button>
        </div>
      </div>

      <div className="api-test-section">
        <div className="api-test-input-group">
          <label>
            Container name
            <input
              className="api-test-input"
              type="text"
              placeholder="Container name"
              value={containerName}
              onChange={(e) => setContainerName(e.target.value)}
            />
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={handleRun}>Run</button>
          <button onClick={handleStop}>Stop</button>
          <button onClick={handleResume}>Resume</button>
          <button onClick={handleDelete}>Delete</button>
          <button onClick={handleGetLogs}>Get Logs</button>
        </div>
      </div>

      {containerList.length > 0 && (
        <div className="api-test-section">
          <h3>Container List</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #e0e0e0' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #e0e0e0' }}>Image</th>
                <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #e0e0e0' }}>Port</th>
                <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #e0e0e0' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {containerList.map((c) => (
                <tr key={c.name}>
                  <td style={{ padding: '4px 8px' }}>{c.name}</td>
                  <td style={{ padding: '4px 8px' }}>{c.image}</td>
                  <td style={{ padding: '4px 8px' }}>{c.port ?? '—'}</td>
                  <td style={{ padding: '4px 8px' }}>{c.status ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {containerLogs.length > 0 && (
        <div className="api-test-section">
          <h3>Container Logs</h3>
          <pre style={{ margin: 0, fontSize: 12, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {containerLogs.join('\n')}
          </pre>
        </div>
      )}
    </div>
  )
}
