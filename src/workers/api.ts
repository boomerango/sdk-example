/**
 * Server worker (ENG-3563).
 *
 * Runs as a Cloudflare Worker on the edge, deployed by Applications-Service
 * during the application build. Its public `*.workers.dev` URL is recorded on
 * the published ApplicationVersion as `serverWorkers[].url`, which Studio's
 * bridge hands back to `serverWorkers().with('api')` in the app.
 *
 * Unlike a background worker, this is NOT an SDK context: there is no
 * `@telemetryos/sdk` client here, no store, no postMessage host. It is a plain
 * HTTP handler. Keep it dependency-free so the bundle stays a single ESM file.
 *
 * Routes exist to make each part of the deploy chain observable from QA:
 *   GET  /status  — proves the worker is deployed and reachable at all
 *   GET  /echo    — round-trips method, path, query and headers
 *   POST /echo    — round-trips the request BODY (regression cover for the
 *                   body-forwarding fix in Application-SDK #134, where a
 *                   Request input was turned into a streaming upload)
 *   GET  /identity — reports the worker's own hostname, so a QA run can tell
 *                   two versions' workers apart without reading the database
 *   GET  /env     — reports which `serverWorker`-target environment variables
 *                   are BOUND, never their values
 */

/** Bindings injected by Applications-Service from `serverWorker`-target env vars. */
type Env = Record<string, unknown>

const BUILT_AT = new Date().toISOString()

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // The app frame calls this cross-origin from its *.applications.telemetryos.com
      // host, so the worker has to answer preflight itself. Runtime auth and a
      // tighter origin policy are CDN-side work (ENG-3624 / ENG-5810).
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
    },
  })

/** Header names only — a value could be a credential and must never be echoed. */
const headerNames = (request: Request) => [...request.headers.keys()].sort()

/**
 * Which server-worker variables are bound, and nothing about what they hold.
 * Cloudflare puts bindings on `env`, so presence is all QA needs to confirm the
 * `target: serverWorker` env-var path reached the deployed worker.
 */
const boundVariableNames = (env: Env) =>
  Object.keys(env ?? {})
    .filter((key) => typeof env[key] === 'string')
    .sort()

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname.replace(/\/+$/, '') || '/'

    if (request.method === 'OPTIONS') {
      return json({ ok: true })
    }

    switch (path) {
      case '/':
      case '/status':
        return json({
          worker: 'api',
          application: 'example_sdk_app',
          status: 'ok',
          builtAt: BUILT_AT,
          now: new Date().toISOString(),
        })

      case '/identity':
        return json({
          worker: 'api',
          // The Cloudflare worker name is the first label of its workers.dev
          // host: `{namespace}-v-{digest}`. Two application versions must
          // report different hostnames — that is the version-scoped identity
          // ENG-3563 introduced.
          hostname: url.hostname,
          cfWorkerName: url.hostname.split('.')[0],
          builtAt: BUILT_AT,
        })

      case '/echo': {
        const body =
          request.method === 'GET' || request.method === 'HEAD' ? null : await request.text()
        return json({
          method: request.method,
          path,
          query: Object.fromEntries(url.searchParams),
          headerNames: headerNames(request),
          contentType: request.headers.get('content-type'),
          bodyLength: body === null ? null : body.length,
          body,
        })
      }

      case '/env':
        return json({
          // Names only. Values are secrets by policy and are never returned.
          boundVariableNames: boundVariableNames(env),
        })

      default:
        return json({ error: `Unknown path ${path}`, worker: 'api' }, 404)
    }
  },
}
