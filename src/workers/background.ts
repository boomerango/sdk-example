import { configure, store } from '@telemetryos/sdk'
import { name } from '~/telemetry.config.json'

// Configure SDK for the worker
configure(name)

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

  // Write to store - UI subscribes to this key
  await store().instance.set('worker_state', JSON.stringify(state))

  console.log(`[Background Worker] ${message}`, data || '')
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
