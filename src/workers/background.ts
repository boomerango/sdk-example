import { configure, store, globalClient } from '@telemetryos/sdk'
import { name } from '~/telemetry.config.json'

console.log('[BackgroundWorker] Starting worker...')
console.log('[BackgroundWorker] Worker URL:', self.location.href)

// Configure SDK for the worker
try {
  configure(name)
  const client = globalClient()
  console.log('[BackgroundWorker] SDK configured successfully')
  console.log('[BackgroundWorker] applicationInstance:', client?.applicationInstance)
  console.log('[BackgroundWorker] applicationSpecifier:', client?.applicationSpecifier)
} catch (error) {
  console.error('[BackgroundWorker] Failed to configure SDK:', error)
  throw error
}

// Worker state
let tickCount = 0
let isRunning = true
const TICK_INTERVAL = 10000 // 10 seconds

// Log function that writes state to store
async function log(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const state = {
    timestamp,
    message,
    data,
    tickCount,
    isRunning,
  }

  console.log(`[BackgroundWorker] Writing to store:`, state)

  // Write to store - UI subscribes to this key
  try {
    await store().instance.set('worker_state', JSON.stringify(state))
    console.log(`[BackgroundWorker] Store write successful`)
  } catch (error) {
    console.error(`[BackgroundWorker] Store write failed:`, error)
  }

  console.log(`[BackgroundWorker] ${message}`, data || '')
}

// Main worker loop
async function tick() {
  if (!isRunning) return

  tickCount++

  // Perform some trivial tasks and report progress
  const tasks = [
    'Checking system health',
    'Syncing data',
    'Processing queue',
    'Cleaning up cache',
    'Updating metrics',
  ]

  const currentTask = tasks[tickCount % tasks.length]
  const randomValue = Math.floor(Math.random() * 100)

  await log(`Tick #${tickCount}: ${currentTask}`, {
    task: currentTask,
    randomValue,
    memoryUsage: `${randomValue}%`,
    queueLength: Math.floor(Math.random() * 50),
  })

  // Schedule next tick
  setTimeout(tick, TICK_INTERVAL)
}

// Start the worker
log('Worker started', { startTime: new Date().toISOString() })
tick()
