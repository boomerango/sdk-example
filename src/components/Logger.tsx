import { LogEntry } from '../types'
import './Logger.css'

interface LoggerProps {
  logs: LogEntry[]
  onClear: () => void
}

export function Logger({ logs, onClear }: LoggerProps) {
  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    const ms = String(date.getMilliseconds()).padStart(3, '0')
    return `${hours}:${minutes}:${seconds}.${ms}`
  }

  const formatData = (data: any) => {
    if (data === undefined) return ''
    try {
      return JSON.stringify(data, null, 2)
    } catch (e) {
      return String(data)
    }
  }

  return (
    <div className="logger">
      <div className="logger-header">
        <h3>SDK Method Logs</h3>
        <button onClick={onClear} className="logger-clear-btn">
          Clear Logs
        </button>
      </div>
      <div className="logger-content">
        {logs.length === 0 ? (
          <div className="logger-empty">No logs yet. Test SDK methods to see logs here.</div>
        ) : (
          <div className="logger-entries">
            {logs.map((log) => (
              <div key={log.id} className={`logger-entry logger-entry--${log.level}`}>
                <div className="logger-entry-header">
                  <span className="logger-entry-time">{formatTime(log.timestamp)}</span>
                  <span className="logger-entry-method">{log.method}</span>
                  <span className={`logger-entry-level logger-entry-level--${log.level}`}>
                    {log.level.toUpperCase()}
                  </span>
                </div>
                <div className="logger-entry-message">{log.message}</div>
                {log.data !== undefined && (
                  <pre className="logger-entry-data">{formatData(log.data)}</pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

