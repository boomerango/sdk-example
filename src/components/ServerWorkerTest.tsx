import { useState } from 'react'
import { serverWorkers } from '@telemetryos/sdk'
import { LogEntry } from '../types'
import './ServerWorkerTest.css'

interface ServerWorkerTestProps {
  onLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
type Method = (typeof METHODS)[number]

const METHODS_WITH_BODY: Method[] = ['POST', 'PUT', 'PATCH']

/**
 * Exercises `serverWorkers().with(name).fetch(path)` end to end (ENG-3563).
 *
 * The whole chain is under test here, and each link fails differently:
 *   1. Applications-Service deploys `workers/api.js` to Cloudflare and records
 *      the `*.workers.dev` URL on the published ApplicationVersion.
 *   2. Studio's bridge answers `serverWorkers.get` by looking that URL up on
 *      the version for THIS application specifier. A worker declared in the
 *      manifest but never deployed comes back as
 *      `Server worker "api" has no deployed URL` — that message means the
 *      persistence half of ENG-3563 did not happen, not that the app is wrong.
 *      An unknown name comes back as `Unknown server worker "..."`.
 *   3. The SDK caches the resolved URL on the handle and then uses native
 *      fetch. Because the handle caches, "Resolve URL" and the request below
 *      deliberately build a FRESH handle each time, so a QA run can re-resolve
 *      after republishing without reloading the app.
 *
 * Absolute and protocol-relative strings are rejected by the SDK on purpose;
 * the path field documents that rather than working around it.
 */
export function ServerWorkerTest({ onLog }: ServerWorkerTestProps) {
  const [workerName, setWorkerName] = useState('api')
  const [path, setPath] = useState('/status')
  const [method, setMethod] = useState<Method>('GET')
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [lastStatus, setLastStatus] = useState<string>('(not sent)')
  const [resolvedUrl, setResolvedUrl] = useState<string>('(not resolved)')

  /**
   * Resolves the worker URL without exercising the worker itself, by issuing a
   * request the transport will make but whose outcome we ignore. The SDK has no
   * public "just resolve" call, so a failure here is a bridge/persistence
   * failure (a TypeError) as distinct from an HTTP failure from the worker.
   */
  const resolveUrl = async () => {
    setResolvedUrl('resolving…')
    onLog({ level: 'info', method: 'serverWorkers().with', message: `Resolving "${workerName}"` })
    try {
      const handle = serverWorkers().with(workerName)
      const response = await handle.fetch('/status')
      // The handle caches the resolved URL; read it back for the evidence trail.
      const url = (handle as unknown as { _cachedUrl: string | null })._cachedUrl ?? '(unknown)'
      setResolvedUrl(url)
      onLog({
        level: 'success',
        method: 'serverWorkers.get',
        message: `Resolved "${workerName}"`,
        data: { url, probeStatus: response.status },
      })
    } catch (error: any) {
      setResolvedUrl('(failed)')
      onLog({
        level: 'error',
        method: 'serverWorkers.get',
        message: error?.message ?? String(error),
        data: { workerName },
      })
    }
  }

  const sendRequest = async () => {
    if (!path.trim()) {
      onLog({ level: 'error', method: 'serverWorkers().fetch', message: 'Please provide a path' })
      return
    }

    const init: RequestInit = { method }
    if (METHODS_WITH_BODY.includes(method) && body.trim()) {
      init.headers = { 'Content-Type': 'application/json' }
      init.body = body
    }

    setIsSending(true)
    setLastStatus('sending…')
    onLog({
      level: 'info',
      method: 'serverWorkers().fetch',
      message: `${method} ${workerName}${path}`,
      data: { workerName, path, requestMethod: method, hasBody: Boolean(init.body) },
    })

    try {
      const response = await serverWorkers().with(workerName).fetch(path, init)
      setLastStatus(`HTTP ${response.status}`)

      const contentType = response.headers.get('content-type')
      const data = contentType?.includes('application/json')
        ? await response.json()
        : await response.text()

      onLog({
        level: response.ok ? 'success' : 'error',
        method: 'serverWorkers().fetch',
        message: `HTTP ${response.status} from "${workerName}${path}"`,
        data: { status: response.status, contentType, data },
      })
    } catch (error: any) {
      setLastStatus('(failed)')
      onLog({
        level: 'error',
        method: 'serverWorkers().fetch',
        message: error?.message ?? String(error),
        data: { workerName, path },
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="server-worker-test">
      <h2>Server Worker</h2>
      <p className="server-worker-description">
        Calls a Cloudflare server worker through <code>serverWorkers().with(name).fetch(path)</code>.
        The URL is resolved from this application version&apos;s{' '}
        <code>serverWorkers[].url</code> by the Studio bridge, so an app that builds fine can still
        fail here if the deploy never recorded a URL.
      </p>

      <div className="server-worker-status">
        <div>
          <span className="server-worker-label">Resolved URL</span>
          <span className="server-worker-value">{resolvedUrl}</span>
        </div>
        <div>
          <span className="server-worker-label">Last response</span>
          <span className="server-worker-value">{lastStatus}</span>
        </div>
      </div>

      <div className="server-worker-row">
        <label>
          Worker name
          <input
            value={workerName}
            onChange={(event) => setWorkerName(event.target.value)}
            placeholder="api"
          />
        </label>
        <button onClick={resolveUrl}>Resolve URL</button>
      </div>

      <div className="server-worker-row">
        <label>
          Method
          <select value={method} onChange={(event) => setMethod(event.target.value as Method)}>
            {METHODS.map((candidate) => (
              <option key={candidate} value={candidate}>
                {candidate}
              </option>
            ))}
          </select>
        </label>
        <label className="server-worker-grow">
          Path
          <input
            value={path}
            onChange={(event) => setPath(event.target.value)}
            placeholder="/status"
          />
        </label>
      </div>

      {METHODS_WITH_BODY.includes(method) && (
        <label className="server-worker-body">
          Body
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            placeholder='{"hello":"worker"}'
          />
        </label>
      )}

      <button className="server-worker-send" onClick={sendRequest} disabled={isSending}>
        {isSending ? 'Sending…' : `Send ${method} ${path}`}
      </button>

      <div className="server-worker-notes">
        <p>
          Worker routes: <code>/status</code>, <code>/identity</code> (reports the Cloudflare worker
          hostname — two application versions must differ), <code>/echo</code> (round-trips the
          request body), <code>/env</code> (names of bound <code>serverWorker</code> variables, never
          values).
        </p>
        <p>
          Absolute and protocol-relative URLs are rejected by the SDK; paths only. Requesting an
          undeclared name is expected to fail with <code>Unknown server worker</code>.
        </p>
      </div>
    </div>
  )
}
