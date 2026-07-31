import { useState } from 'react'
import { proxy } from '@telemetryos/sdk'
import { LogEntry } from '../types'
import './ProxyFetchTest.css'

interface ProxyFetchTestProps {
  onLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void
}

const METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
type Method = (typeof METHODS)[number]

const METHODS_WITH_BODY: Method[] = ['POST', 'PUT', 'PATCH']

/** Header values are never logged — only their names — so evidence can be captured safely. */
const redactHeaderNames = (headers: Record<string, string>) => Object.keys(headers)

/**
 * Exercises `proxy().fetch()` from application context with an app-supplied
 * upstream credential (ENG-5394).
 *
 * The platform reserves `Authorization` for its own gateway auth, so an app's
 * third-party credential has to be diverted by the host frame into
 * `X-Tos-Upstream-Authorization`, which the proxy re-applies as the upstream
 * request's `Authorization`. That diversion happens in the Studio bridge
 * handler, not here — this app deliberately sends the credential the naive way,
 * as `Authorization`, because that is exactly what a real app does and what the
 * fix has to cope with.
 *
 * The extra-header field exists so the two adjacent cases can be driven from the
 * same panel: a non-reserved header (`X-Api-Key`) must reach the target
 * unchanged, and an app trying to set `X-Tos-Upstream-Authorization` itself must
 * have it dropped rather than honoured.
 */
export function ProxyFetchTest({ onLog }: ProxyFetchTestProps) {
  const [url, setUrl] = useState('https://api.github.com/zen')
  const [method, setMethod] = useState<Method>('GET')
  const [authorization, setAuthorization] = useState('')
  const [extraHeaderName, setExtraHeaderName] = useState('')
  const [extraHeaderValue, setExtraHeaderValue] = useState('')
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [lastStatus, setLastStatus] = useState<string>('(not sent)')

  const buildHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {}
    if (authorization.trim()) headers['Authorization'] = authorization.trim()
    if (extraHeaderName.trim()) headers[extraHeaderName.trim()] = extraHeaderValue
    return headers
  }

  const sendProxyFetch = async () => {
    if (!url.trim()) {
      onLog({ level: 'error', method: 'proxy().fetch', message: 'Please provide a URL to fetch' })
      return
    }

    const headers = buildHeaders()
    const init: RequestInit = { method, headers }
    if (METHODS_WITH_BODY.includes(method) && body.trim()) init.body = body

    setIsSending(true)
    setLastStatus('sending…')

    onLog({
      level: 'info',
      method: 'proxy().fetch',
      message: `${method} ${url}`,
      // Header NAMES only — a third-party credential must never land in a log,
      // a screenshot, or a QA artifact.
      data: { url, requestMethod: method, headerNames: redactHeaderNames(headers), hasBody: Boolean(init.body) },
    })

    try {
      const response = await proxy().fetch(url, init)
      const contentType = response.headers.get('content-type')

      let data: any
      if (method === 'HEAD') {
        data = '(no body — HEAD)'
      } else if (contentType?.includes('application/json')) {
        data = await response.json().catch(() => '(body was not valid JSON)')
      } else {
        data = await response.text()
      }

      setLastStatus(`${response.status} ${response.statusText}`)
      onLog({
        // A 401 is the ENG-5394 symptom, not a transport failure — surface it as
        // a warning with the status intact rather than burying it as success.
        level: response.ok ? 'success' : 'warning',
        method: 'proxy().fetch',
        message: `${method} ${url} → ${response.status} ${response.statusText}`,
        data: {
          url,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          contentType,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          data,
        },
      })
    } catch (error: any) {
      // A CORS/preflight rejection lands here with no status at all, which is a
      // different failure from an upstream 401 — say so, since telling the two
      // apart is the whole point of this panel.
      setLastStatus('request failed (no response)')
      onLog({
        level: 'error',
        method: 'proxy().fetch',
        message: `${method} ${url} failed with no response: ${error.message}`,
        data: {
          url,
          error: error.message,
          hint: 'No HTTP status means the request never completed — check the browser console and network panel for a CORS/preflight rejection, which is distinct from an upstream 401.',
        },
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="proxy-fetch-test">
      <h2>Proxy Fetch — Upstream Credential</h2>
      <p className="proxy-fetch-description">
        Calls <code>proxy().fetch()</code> from application context. Put a third-party API credential in{' '}
        <strong>Authorization</strong> to check it reaches the upstream service (ENG-5394); the platform must carry it
        as <code>X-Tos-Upstream-Authorization</code> rather than consuming it as its own gateway auth.
      </p>

      <div className="proxy-fetch-status">
        <strong>Last response:</strong> <span className="proxy-fetch-status-value">{lastStatus}</span>
      </div>

      <div className="proxy-fetch-row">
        <label className="proxy-fetch-field proxy-fetch-field-wide">
          URL
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/resource"
            className="proxy-fetch-input"
          />
        </label>
        <label className="proxy-fetch-field">
          Method
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as Method)}
            className="proxy-fetch-input"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="proxy-fetch-row">
        <label className="proxy-fetch-field proxy-fetch-field-wide">
          Authorization <span className="proxy-fetch-hint">(the app&apos;s own upstream credential)</span>
          {/* type=password so a live token cannot be read off a QA screenshot */}
          <input
            type="password"
            value={authorization}
            onChange={(e) => setAuthorization(e.target.value)}
            placeholder="Bearer pat123…"
            autoComplete="off"
            className="proxy-fetch-input"
          />
        </label>
      </div>

      <div className="proxy-fetch-row">
        <label className="proxy-fetch-field">
          Extra header name
          <input
            type="text"
            value={extraHeaderName}
            onChange={(e) => setExtraHeaderName(e.target.value)}
            placeholder="X-Api-Key"
            className="proxy-fetch-input"
          />
        </label>
        <label className="proxy-fetch-field">
          Extra header value
          <input
            type="text"
            value={extraHeaderValue}
            onChange={(e) => setExtraHeaderValue(e.target.value)}
            placeholder="value"
            className="proxy-fetch-input"
          />
        </label>
      </div>

      {METHODS_WITH_BODY.includes(method) && (
        <div className="proxy-fetch-row">
          <label className="proxy-fetch-field proxy-fetch-field-wide">
            Body
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"key":"value"}'
              rows={4}
              className="proxy-fetch-input proxy-fetch-textarea"
            />
          </label>
        </div>
      )}

      <div className="proxy-fetch-buttons">
        <button onClick={sendProxyFetch} disabled={isSending} className="btn btn-primary">
          {isSending ? 'Sending…' : 'Send Proxy Fetch'}
        </button>
      </div>

      <ul className="proxy-fetch-notes">
        <li>
          <strong>Authorization</strong> is sent as the app would naively send it. The host frame is responsible for
          diverting it to <code>X-Tos-Upstream-Authorization</code>.
        </li>
        <li>
          Setting <strong>Extra header</strong> to <code>X-Tos-Upstream-Authorization</code> must be dropped by the
          host, not forwarded — an app may not set a privileged platform header itself.
        </li>
        <li>
          Setting it to <code>X-Api-Key</code> should reach the target unchanged; that header is not reserved.
        </li>
        <li>Header values are never written to the log — only header names.</li>
      </ul>
    </div>
  )
}
