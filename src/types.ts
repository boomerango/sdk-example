export type LogLevel = 'success' | 'error' | 'info' | 'warning'

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  method: string
  message: string
  data?: any
}

export type SdkStoreScope = 'application' | 'device' | 'instance'

