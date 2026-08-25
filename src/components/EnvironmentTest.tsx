import { useState, useEffect, useRef } from 'react'
import { environment } from '@telemetryos/sdk'
import { LogEntry } from '../types'
import './EnvironmentTest.css'

interface EnvironmentTestProps {
  // Optional so the panel can be dropped into a view that has no shared Logger
  // (Edit has none). Its own readout works either way.
  onLog?: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void
}

interface OnlineEvent {
  id: string
  at: Date
  isOnline: boolean
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

export function EnvironmentTest({ onLog }: EnvironmentTestProps) {
  const [environmentType, setEnvironmentType] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [colorScheme, setColorScheme] = useState<string | null>(null)
  const [isOnlineSubscribed, setIsOnlineSubscribed] = useState(false)
  const [onlineEvents, setOnlineEvents] = useState<OnlineEvent[]>([])
  const [lastError, setLastError] = useState<string | null>(null)
  const isOnlineSubscribedRef = useRef(false)

  const report = (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    if (log.level === 'error') {
      setLastError(log.message)
    } else {
      setLastError(null)
    }
    onLog?.(log)
  }

  // Drop the online-signal subscription on unmount so a remount does not stack
  // handlers on the same client.
  useEffect(() => {
    return () => {
      if (isOnlineSubscribedRef.current) {
        environment()
          .unsubscribeIsOnline()
          .catch(() => {
            // Nothing to report: the component is already going away.
          })
      }
    }
  }, [])

  const handleGetCurrent = async () => {
    try {
      const result = await environment().getCurrent()
      setEnvironmentType(result)
      report({
        level: 'success',
        method: 'environment().getCurrent',
        message: `Running in host: ${result}`,
        data: { environment: result },
      })
      console.log('Environment getCurrent result:', result)
    } catch (error: any) {
      report({
        level: 'error',
        method: 'environment().getCurrent',
        message: `Failed to get environment: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Environment getCurrent error:', error)
    }
  }

  // Deprecated alias for getCurrent(). Exercised separately so a divergence
  // between the two is visible rather than hidden behind one call site.
  const handleGetEnvironment = async () => {
    try {
      const result = await environment().getEnvironment()
      setEnvironmentType(result)
      report({
        level: 'success',
        method: 'environment().getEnvironment',
        message: `Running in host: ${result} (deprecated alias)`,
        data: { environment: result },
      })
      console.log('Environment getEnvironment result:', result)
    } catch (error: any) {
      report({
        level: 'error',
        method: 'environment().getEnvironment',
        message: `Failed to get environment: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Environment getEnvironment error:', error)
    }
  }

  const handleGetIsOnline = async () => {
    try {
      const result = await environment().getIsOnline()
      setIsOnline(result)
      report({
        level: 'success',
        method: 'environment().getIsOnline',
        message: `Host reports online: ${result}`,
        data: { isOnline: result },
      })
      console.log('Environment getIsOnline result:', result)
    } catch (error: any) {
      report({
        level: 'error',
        method: 'environment().getIsOnline',
        message: `Failed to get online signal: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Environment getIsOnline error:', error)
    }
  }

  const handleSubscribeIsOnline = async () => {
    try {
      // The handler receives a bare boolean, not an object. On the players the
      // first value can be `false` before the platform socket authenticates, so
      // every delivery is recorded rather than only the first.
      const result = await environment().subscribeIsOnline((online) => {
        setIsOnline(online)
        setOnlineEvents((prev) => [
          { id: `${Date.now()}-${Math.random()}`, at: new Date(), isOnline: online },
          ...prev,
        ])
        report({
          level: 'info',
          method: 'environment().subscribeIsOnline',
          message: `Online signal changed to ${online}`,
          data: { isOnline: online },
        })
        console.log('Online signal changed:', online)
      })
      isOnlineSubscribedRef.current = true
      setIsOnlineSubscribed(true)
      report({
        level: 'success',
        method: 'environment().subscribeIsOnline',
        message: `Subscribed to online signal changes`,
        data: { success: result },
      })
      console.log('Environment subscribeIsOnline result:', result)
    } catch (error: any) {
      report({
        level: 'error',
        method: 'environment().subscribeIsOnline',
        message: `Failed to subscribe to online signal: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Environment subscribeIsOnline error:', error)
    }
  }

  const handleUnsubscribeIsOnline = async () => {
    try {
      const result = await environment().unsubscribeIsOnline()
      isOnlineSubscribedRef.current = false
      setIsOnlineSubscribed(false)
      report({
        level: 'success',
        method: 'environment().unsubscribeIsOnline',
        message: `Unsubscribed from online signal changes`,
        data: { success: result },
      })
      console.log('Environment unsubscribeIsOnline result:', result)
    } catch (error: any) {
      report({
        level: 'error',
        method: 'environment().unsubscribeIsOnline',
        message: `Failed to unsubscribe from online signal: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Environment unsubscribeIsOnline error:', error)
    }
  }

  const handleGetColorScheme = async () => {
    try {
      const result = await environment().getColorScheme()
      setColorScheme(result)
      report({
        level: 'success',
        method: 'environment().getColorScheme',
        message: `Retrieved current color scheme`,
        data: { colorScheme: result },
      })
      console.log('Environment getColorScheme result:', result)
    } catch (error: any) {
      report({
        level: 'error',
        method: 'environment().getColorScheme',
        message: `Failed to get color scheme: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Environment getColorScheme error:', error)
    }
  }

  const handleSubscribeColorScheme = async () => {
    try {
      const result = await environment().subscribeColorScheme((scheme) => {
        setColorScheme(scheme)
        report({
          level: 'info',
          method: 'environment().subscribeColorScheme',
          message: `Color scheme changed`,
          data: { colorScheme: scheme },
        })
        console.log('Color scheme changed:', scheme)
      })
      report({
        level: 'success',
        method: 'environment().subscribeColorScheme',
        message: `Subscribed to color scheme changes`,
        data: { success: result },
      })
      console.log('Environment subscribeColorScheme result:', result)
    } catch (error: any) {
      report({
        level: 'error',
        method: 'environment().subscribeColorScheme',
        message: `Failed to subscribe to color scheme: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Environment subscribeColorScheme error:', error)
    }
  }

  const handleUnsubscribeColorScheme = async () => {
    try {
      const result = await environment().unsubscribeColorScheme()
      report({
        level: 'success',
        method: 'environment().unsubscribeColorScheme',
        message: `Unsubscribed from color scheme changes`,
        data: { success: result },
      })
      console.log('Environment unsubscribeColorScheme result:', result)
    } catch (error: any) {
      report({
        level: 'error',
        method: 'environment().unsubscribeColorScheme',
        message: `Failed to unsubscribe from color scheme: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Environment unsubscribeColorScheme error:', error)
    }
  }

  return (
    <div className="environment-test">
      <h2>Environment API</h2>
      <p className="environment-test-description">
        The host the application is running in, the host's online signal, and the color
        scheme. The online signal means different things per host — on the players it also
        requires an authenticated platform socket, while in Studio it is only the browser's
        own network belief.
      </p>

      <div className="environment-test-readout">
        <div className="environment-test-readout-item">
          <span className="environment-test-label">Host</span>
          <span className="environment-test-value">{environmentType ?? 'not read yet'}</span>
        </div>
        <div className="environment-test-readout-item">
          <span className="environment-test-label">Online</span>
          <span className="environment-test-value">
            {isOnline === null ? 'not read yet' : String(isOnline)}
          </span>
        </div>
        <div className="environment-test-readout-item">
          <span className="environment-test-label">Color scheme</span>
          <span className="environment-test-value">{colorScheme ?? 'not read yet'}</span>
        </div>
        <div className="environment-test-readout-item">
          <span className="environment-test-label">Online subscription</span>
          <span className="environment-test-value">
            {isOnlineSubscribed ? `active (${onlineEvents.length} changes)` : 'inactive'}
          </span>
        </div>
      </div>

      {lastError && <div className="environment-test-error">{lastError}</div>}

      <div className="environment-test-section">
        <h3>Host</h3>
        <div className="environment-test-buttons">
          <button onClick={handleGetCurrent} className="btn btn-primary">
            Get Environment
          </button>
          <button onClick={handleGetEnvironment} className="btn btn-secondary">
            Get Environment (deprecated alias)
          </button>
        </div>
      </div>

      <div className="environment-test-section">
        <h3>Online Signal</h3>
        <div className="environment-test-buttons">
          <button onClick={handleGetIsOnline} className="btn btn-primary">
            Get Is Online
          </button>
          <button onClick={handleSubscribeIsOnline} className="btn btn-secondary">
            Subscribe to Is Online
          </button>
          <button onClick={handleUnsubscribeIsOnline} className="btn btn-secondary">
            Unsubscribe from Is Online
          </button>
        </div>
        {onlineEvents.length > 0 && (
          <ul className="environment-test-events">
            {onlineEvents.map((event) => (
              <li key={event.id}>
                <span className="environment-test-event-time">{formatTime(event.at)}</span>
                <span>online = {String(event.isOnline)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="environment-test-section">
        <h3>Color Scheme</h3>
        <div className="environment-test-buttons">
          <button onClick={handleGetColorScheme} className="btn btn-primary">
            Get Color Scheme
          </button>
          <button onClick={handleSubscribeColorScheme} className="btn btn-secondary">
            Subscribe to Color Scheme
          </button>
          <button onClick={handleUnsubscribeColorScheme} className="btn btn-secondary">
            Unsubscribe from Color Scheme
          </button>
        </div>
      </div>
    </div>
  )
}
