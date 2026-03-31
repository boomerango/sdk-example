import { useState, useEffect, useRef } from 'react'
import { LogEntry } from '../types'
import './BrowserApiTest.css'

interface BrowserApiTestProps {
  onLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void
}

type ApiStatus =
  | 'PENDING'
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'BLOCKED'
  | 'GESTURE_REQUIRED'
  | 'PERMISSION_DENIED'
  | 'NO_DEVICE'
  | 'GRANTED'
  | 'ERROR'

interface ApiTestResult {
  status: ApiStatus
  detail: string
}

interface BrowserApiResults {
  usbCheck: ApiTestResult
  usbDevices: ApiTestResult
  serialCheck: ApiTestResult
  serialPorts: ApiTestResult
  bluetoothCheck: ApiTestResult
  bluetoothAvailability: ApiTestResult
  bluetoothDevices: ApiTestResult
  cameraCheck: ApiTestResult
  cameraDevices: ApiTestResult
  cameraStream: ApiTestResult
}

interface HardwareEvent {
  id: string
  timestamp: Date
  type: 'usb-connect' | 'usb-disconnect'
  name: string
  detail: string
}

interface SerialPanel {
  index: number
  baudRate: number
  isOpen: boolean
  rxLines: string[]
}

const PENDING: ApiTestResult = { status: 'PENDING', detail: 'Not tested yet' }
const POLICY_FEATURES_TO_CHECK = ['usb', 'serial', 'bluetooth', 'camera', 'microphone']

function getPlatform(): string {
  const ua = navigator.userAgent
  if (/Android/i.test(ua)) return 'Android'
  if (/Electron/i.test(ua)) return 'Electron (TOSE)'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS'
  return 'Desktop Browser'
}

function getPermissionsPolicyFeatures(): string[] {
  const policy = (document as any).featurePolicy ?? (document as any).permissionsPolicy
  if (!policy) return []
  try {
    return policy.allowedFeatures() as string[]
  } catch {
    return []
  }
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

function StatusBadge({ result }: { result: ApiTestResult }) {
  const cls = `status-badge status-${result.status.toLowerCase()}`
  return <span className={cls}>{result.status}</span>
}

export function BrowserApiTest({ onLog }: BrowserApiTestProps) {
  const [results, setResults] = useState<BrowserApiResults>({
    usbCheck: PENDING,
    usbDevices: PENDING,
    serialCheck: PENDING,
    serialPorts: PENDING,
    bluetoothCheck: PENDING,
    bluetoothAvailability: PENDING,
    bluetoothDevices: PENDING,
    cameraCheck: PENDING,
    cameraDevices: PENDING,
    cameraStream: PENDING,
  })
  const [policyFeatures, setPolicyFeatures] = useState<string[]>([])
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null)
  const [hardwareEvents, setHardwareEvents] = useState<HardwareEvent[]>([])
  const [serialPanels, setSerialPanels] = useState<SerialPanel[]>([])
  const [serialSendInputs, setSerialSendInputs] = useState<Record<number, string>>({})
  const videoRef = useRef<HTMLVideoElement>(null)
  const serialPortsRef = useRef<any[]>([])
  const readerRefsRef = useRef<ReadableStreamDefaultReader<any>[]>([])
  const platform = getPlatform()

  // --- WebUSB ---

  const testUsbCheck = () => {
    if (!('usb' in navigator)) {
      setResults((prev) => ({ ...prev, usbCheck: { status: 'UNAVAILABLE', detail: 'navigator.usb not present' } }))
      onLog({ level: 'warning', method: 'navigator.usb', message: 'WebUSB API not available' })
      return
    }
    setResults((prev) => ({ ...prev, usbCheck: { status: 'AVAILABLE', detail: 'navigator.usb present' } }))
    onLog({ level: 'success', method: 'navigator.usb', message: 'WebUSB API is present' })
  }

  const testUsbDevices = async () => {
    if (!('usb' in navigator)) {
      setResults((prev) => ({ ...prev, usbDevices: { status: 'UNAVAILABLE', detail: 'navigator.usb not present' } }))
      return
    }
    try {
      const devices: any[] = await (navigator as any).usb.getDevices()
      setResults((prev) => ({ ...prev, usbDevices: { status: 'AVAILABLE', detail: `${devices.length} paired device(s)` } }))
      onLog({
        level: 'success',
        method: 'navigator.usb.getDevices',
        message: `${devices.length} pre-paired USB device(s) (no prompt)`,
        data: { count: devices.length, devices: devices.map((d) => ({ name: d.productName, vendor: d.vendorId, product: d.productId })) },
      })
    } catch (error: any) {
      setResults((prev) => ({ ...prev, usbDevices: { status: 'ERROR', detail: error.message } }))
      onLog({ level: 'error', method: 'navigator.usb.getDevices', message: error.message })
    }
  }

  // --- WebSerial ---

  const testSerialCheck = () => {
    if (/Android/i.test(navigator.userAgent)) {
      setResults((prev) => ({ ...prev, serialCheck: { status: 'UNAVAILABLE', detail: 'Not supported on Android' } }))
      onLog({ level: 'warning', method: 'navigator.serial', message: 'WebSerial is not supported on Android Chrome' })
      return
    }
    if (!('serial' in navigator)) {
      setResults((prev) => ({ ...prev, serialCheck: { status: 'UNAVAILABLE', detail: 'navigator.serial not present' } }))
      onLog({ level: 'warning', method: 'navigator.serial', message: 'WebSerial API not available' })
      return
    }
    setResults((prev) => ({ ...prev, serialCheck: { status: 'AVAILABLE', detail: 'navigator.serial present' } }))
    onLog({ level: 'success', method: 'navigator.serial', message: 'WebSerial API is present' })
  }

  const testSerialPorts = async () => {
    if (!('serial' in navigator)) {
      setResults((prev) => ({ ...prev, serialPorts: { status: 'UNAVAILABLE', detail: 'navigator.serial not present' } }))
      return
    }
    try {
      const ports: any[] = await (navigator as any).serial.getPorts()
      serialPortsRef.current = ports
      setSerialPanels(ports.map((_, i) => ({ index: i, baudRate: 9600, isOpen: false, rxLines: [] })))
      setResults((prev) => ({ ...prev, serialPorts: { status: 'AVAILABLE', detail: `${ports.length} permitted port(s)` } }))
      onLog({
        level: 'success',
        method: 'navigator.serial.getPorts',
        message: `${ports.length} pre-permitted serial port(s) (no prompt)`,
        data: { count: ports.length },
      })
    } catch (error: any) {
      setResults((prev) => ({ ...prev, serialPorts: { status: 'ERROR', detail: error.message } }))
      onLog({ level: 'error', method: 'navigator.serial.getPorts', message: error.message })
    }
  }

  const openSerialPort = async (index: number) => {
    const port = serialPortsRef.current[index]
    if (!port) return
    const panel = serialPanels.find((p) => p.index === index)
    const baudRate = panel?.baudRate ?? 9600
    try {
      await port.open({ baudRate })
      setSerialPanels((prev) => prev.map((p) => (p.index === index ? { ...p, isOpen: true } : p)))
      onLog({ level: 'success', method: 'serial.open', message: `Port ${index + 1} opened at ${baudRate} baud` })

      const reader = port.readable.getReader()
      readerRefsRef.current[index] = reader
      const decoder = new TextDecoder()
      let buffer = ''

      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            if (lines.length > 0) {
              setSerialPanels((prev) =>
                prev.map((p) => {
                  if (p.index !== index) return p
                  return { ...p, rxLines: [...p.rxLines, ...lines].slice(-200) }
                }),
              )
              lines.forEach((line) => onLog({ level: 'info', method: `serial[${index + 1}] rx`, message: line }))
            }
          }
        } catch {
          // reader cancelled or port closed — normal shutdown
        }
      }
      readLoop()
    } catch (error: any) {
      onLog({ level: 'error', method: 'serial.open', message: `Port ${index + 1}: ${error.message}` })
    }
  }

  const closeSerialPort = async (index: number) => {
    const reader = readerRefsRef.current[index]
    if (reader) {
      try {
        await reader.cancel()
      } catch {
        // ignore
      }
      readerRefsRef.current[index] = undefined as any
    }
    const port = serialPortsRef.current[index]
    if (port) {
      try {
        await port.close()
      } catch {
        // ignore
      }
    }
    setSerialPanels((prev) => prev.map((p) => (p.index === index ? { ...p, isOpen: false } : p)))
    onLog({ level: 'warning', method: 'serial.close', message: `Port ${index + 1} closed` })
  }

  const sendSerial = async (index: number) => {
    const port = serialPortsRef.current[index]
    if (!port) return
    const text = (serialSendInputs[index] ?? '').trim()
    if (!text) return
    try {
      const writer = port.writable.getWriter()
      await writer.write(new TextEncoder().encode(text + '\n'))
      writer.releaseLock()
      onLog({ level: 'info', method: `serial[${index + 1}] tx`, message: text })
      setSerialSendInputs((prev) => ({ ...prev, [index]: '' }))
    } catch (error: any) {
      onLog({ level: 'error', method: 'serial.write', message: `Port ${index + 1}: ${error.message}` })
    }
  }

  const updateSerialBaudRate = (index: number, baudRate: number) => {
    setSerialPanels((prev) => prev.map((p) => (p.index === index ? { ...p, baudRate } : p)))
  }

  const updateSerialSendInput = (index: number, value: string) => {
    setSerialSendInputs((prev) => ({ ...prev, [index]: value }))
  }

  // --- WebBluetooth ---

  const testBluetoothCheck = () => {
    if (!('bluetooth' in navigator)) {
      setResults((prev) => ({ ...prev, bluetoothCheck: { status: 'UNAVAILABLE', detail: 'navigator.bluetooth not present' } }))
      onLog({ level: 'warning', method: 'navigator.bluetooth', message: 'WebBluetooth API not available' })
      return
    }
    setResults((prev) => ({ ...prev, bluetoothCheck: { status: 'AVAILABLE', detail: 'navigator.bluetooth present' } }))
    onLog({ level: 'success', method: 'navigator.bluetooth', message: 'WebBluetooth API is present' })
  }

  const testBluetoothAvailability = async () => {
    if (!('bluetooth' in navigator)) {
      setResults((prev) => ({ ...prev, bluetoothAvailability: { status: 'UNAVAILABLE', detail: 'navigator.bluetooth not present' } }))
      return
    }
    try {
      const available: boolean = await (navigator as any).bluetooth.getAvailability()
      const result: ApiTestResult = available
        ? { status: 'AVAILABLE', detail: 'Bluetooth hardware present' }
        : { status: 'UNAVAILABLE', detail: 'No Bluetooth hardware' }
      setResults((prev) => ({ ...prev, bluetoothAvailability: result }))
      onLog({
        level: available ? 'success' : 'warning',
        method: 'navigator.bluetooth.getAvailability',
        message: available ? 'Bluetooth hardware is present (no prompt)' : 'No Bluetooth hardware detected',
        data: { available },
      })
    } catch (error: any) {
      setResults((prev) => ({ ...prev, bluetoothAvailability: { status: 'ERROR', detail: error.message } }))
      onLog({ level: 'error', method: 'navigator.bluetooth.getAvailability', message: error.message })
    }
  }

  const testBluetoothDevices = async () => {
    if (!('bluetooth' in navigator)) {
      setResults((prev) => ({ ...prev, bluetoothDevices: { status: 'UNAVAILABLE', detail: 'navigator.bluetooth not present' } }))
      return
    }
    if (typeof (navigator as any).bluetooth.getDevices !== 'function') {
      setResults((prev) => ({ ...prev, bluetoothDevices: { status: 'UNAVAILABLE', detail: 'getDevices() not supported in this build' } }))
      onLog({ level: 'warning', method: 'navigator.bluetooth.getDevices', message: 'getDevices() is not a function in this browser/Electron build' })
      return
    }
    try {
      const devices: any[] = await (navigator as any).bluetooth.getDevices()
      setResults((prev) => ({ ...prev, bluetoothDevices: { status: 'AVAILABLE', detail: `${devices.length} permitted device(s)` } }))
      onLog({
        level: 'success',
        method: 'navigator.bluetooth.getDevices',
        message: `${devices.length} pre-permitted Bluetooth device(s) (no prompt)`,
        data: { count: devices.length, devices: devices.map((d) => ({ name: d.name, id: d.id })) },
      })
    } catch (error: any) {
      setResults((prev) => ({ ...prev, bluetoothDevices: { status: 'ERROR', detail: error.message } }))
      onLog({ level: 'error', method: 'navigator.bluetooth.getDevices', message: error.message })
    }
  }

  // --- Camera ---

  const testCameraCheck = () => {
    if (!('mediaDevices' in navigator)) {
      setResults((prev) => ({ ...prev, cameraCheck: { status: 'UNAVAILABLE', detail: 'navigator.mediaDevices not present' } }))
      onLog({ level: 'warning', method: 'navigator.mediaDevices', message: 'MediaDevices API not available' })
      return
    }
    setResults((prev) => ({ ...prev, cameraCheck: { status: 'AVAILABLE', detail: 'navigator.mediaDevices present' } }))
    onLog({ level: 'success', method: 'navigator.mediaDevices', message: 'MediaDevices API is present' })
  }

  const testCameraDevices = async () => {
    if (!('mediaDevices' in navigator)) {
      setResults((prev) => ({ ...prev, cameraDevices: { status: 'UNAVAILABLE', detail: 'navigator.mediaDevices not present' } }))
      return
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter((d) => d.kind === 'videoinput')
      setResults((prev) => ({ ...prev, cameraDevices: { status: 'AVAILABLE', detail: `${videoInputs.length} video input(s)` } }))
      onLog({
        level: 'success',
        method: 'navigator.mediaDevices.enumerateDevices',
        message: `${videoInputs.length} video input(s) found (no prompt)`,
        data: { video: videoInputs.length, audio: devices.filter((d) => d.kind === 'audioinput').length },
      })
    } catch (error: any) {
      setResults((prev) => ({ ...prev, cameraDevices: { status: 'ERROR', detail: error.message } }))
      onLog({ level: 'error', method: 'navigator.mediaDevices.enumerateDevices', message: error.message })
    }
  }

  const openCameraPreview = async () => {
    if (!('mediaDevices' in navigator)) {
      setResults((prev) => ({ ...prev, cameraStream: { status: 'UNAVAILABLE', detail: 'navigator.mediaDevices not present' } }))
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setLiveStream(stream)
      setResults((prev) => ({ ...prev, cameraStream: { status: 'GRANTED', detail: 'Stream active — preview open' } }))
      onLog({ level: 'success', method: 'navigator.mediaDevices.getUserMedia', message: 'Camera stream open' })
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setResults((prev) => ({ ...prev, cameraStream: { status: 'PERMISSION_DENIED', detail: 'Permission denied' } }))
        onLog({ level: 'error', method: 'navigator.mediaDevices.getUserMedia', message: 'Camera permission denied', data: { name: error.name } })
      } else if (error.name === 'NotFoundError') {
        setResults((prev) => ({ ...prev, cameraStream: { status: 'NO_DEVICE', detail: 'No camera found' } }))
        onLog({ level: 'warning', method: 'navigator.mediaDevices.getUserMedia', message: 'No camera device found', data: { name: error.name } })
      } else {
        setResults((prev) => ({ ...prev, cameraStream: { status: 'ERROR', detail: error.message } }))
        onLog({ level: 'error', method: 'navigator.mediaDevices.getUserMedia', message: error.message, data: { name: error.name } })
      }
    }
  }

  const closeCameraPreview = () => {
    liveStream?.getTracks().forEach((t) => t.stop())
    setLiveStream(null)
    setResults((prev) => ({ ...prev, cameraStream: { status: 'AVAILABLE', detail: 'Stream closed' } }))
    onLog({ level: 'info', method: 'navigator.mediaDevices.getUserMedia', message: 'Camera stream closed' })
  }

  // --- Re-run all auto tests ---

  const runAllAutoTests = () => {
    testUsbCheck()
    testUsbDevices()
    testSerialCheck()
    testSerialPorts()
    testBluetoothCheck()
    testBluetoothAvailability()
    testBluetoothDevices()
    testCameraCheck()
    testCameraDevices()
    setPolicyFeatures(getPermissionsPolicyFeatures())
  }

  // --- Effects ---

  function mountEffect() {
    runAllAutoTests()
  }
  useEffect(mountEffect, []) // eslint-disable-line react-hooks/exhaustive-deps

  function usbEventsEffect() {
    if (!('usb' in navigator)) return
    const usb = (navigator as any).usb
    const onConnect = (e: any) => {
      const d = e.device
      const name = d.productName || `Device ${d.vendorId.toString(16)}:${d.productId.toString(16)}`
      const detail = `VID:${d.vendorId.toString(16).padStart(4, '0')} PID:${d.productId.toString(16).padStart(4, '0')} • ${d.manufacturerName || 'unknown'}`
      setHardwareEvents((prev) => [
        { id: String(Date.now()), timestamp: new Date(), type: 'usb-connect', name, detail },
        ...prev.slice(0, 49),
      ])
      onLog({
        level: 'success',
        method: 'navigator.usb [connect]',
        message: `USB connected: ${name}`,
        data: { vendorId: d.vendorId, productId: d.productId, manufacturerName: d.manufacturerName, serialNumber: d.serialNumber },
      })
    }
    const onDisconnect = (e: any) => {
      const d = e.device
      const name = d.productName || `Device ${d.vendorId.toString(16)}:${d.productId.toString(16)}`
      setHardwareEvents((prev) => [
        { id: String(Date.now()), timestamp: new Date(), type: 'usb-disconnect', name, detail: '' },
        ...prev.slice(0, 49),
      ])
      onLog({ level: 'warning', method: 'navigator.usb [disconnect]', message: `USB disconnected: ${name}` })
    }
    usb.addEventListener('connect', onConnect)
    usb.addEventListener('disconnect', onDisconnect)
    return () => {
      usb.removeEventListener('connect', onConnect)
      usb.removeEventListener('disconnect', onDisconnect)
    }
  }
  useEffect(usbEventsEffect, []) // eslint-disable-line react-hooks/exhaustive-deps

  function cameraPreviewEffect() {
    if (videoRef.current) videoRef.current.srcObject = liveStream
  }
  useEffect(cameraPreviewEffect, [liveStream])

  return (
    <div className="browser-api-test">
      <h2>Browser Hardware APIs</h2>
      <p className="browser-api-test-description">
        Tests WebUSB, WebSerial, WebBluetooth, and Camera availability — no user gesture required for read operations.
        Connect/requestDevice operations require a user gesture and are not tested automatically.
      </p>
      <div className="browser-api-platform">Platform: {platform}</div>

      {liveStream && (
        <div className="camera-overlay">
          <div className="camera-overlay-card">
            <video ref={videoRef} autoPlay playsInline className="camera-preview-video" />
            <button className="camera-close-btn" onClick={closeCameraPreview}>✕ Close Stream</button>
          </div>
        </div>
      )}

      {/* WebUSB */}
      <div className="browser-api-section">
        <h3>WebUSB</h3>
        <table className="browser-api-table">
          <thead>
            <tr>
              <th>Test</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>API present</td>
              <td><StatusBadge result={results.usbCheck} /></td>
              <td className="browser-api-note">{results.usbCheck.detail}</td>
            </tr>
            <tr>
              <td>getDevices() — no prompt</td>
              <td><StatusBadge result={results.usbDevices} /></td>
              <td className="browser-api-note">{results.usbDevices.detail}</td>
            </tr>
            <tr>
              <td>requestDevice()</td>
              <td><span className="status-badge status-gesture_required">GESTURE_REQUIRED</span></td>
              <td className="browser-api-note">Requires user gesture — not auto-tested</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* WebSerial */}
      <div className="browser-api-section">
        <h3>WebSerial</h3>
        <table className="browser-api-table">
          <thead>
            <tr>
              <th>Test</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>API present</td>
              <td><StatusBadge result={results.serialCheck} /></td>
              <td className="browser-api-note">{results.serialCheck.detail}</td>
            </tr>
            <tr>
              <td>getPorts() — no prompt</td>
              <td><StatusBadge result={results.serialPorts} /></td>
              <td className="browser-api-note">{results.serialPorts.detail}</td>
            </tr>
            <tr>
              <td>requestPort()</td>
              <td><span className="status-badge status-gesture_required">GESTURE_REQUIRED</span></td>
              <td className="browser-api-note">Requires user gesture — not auto-tested</td>
            </tr>
          </tbody>
        </table>
        {serialPanels.length > 0 && (
          <div className="serial-panels">
            {serialPanels.map((panel) => (
              <div key={panel.index} className="serial-panel">
                <div className="serial-panel-header">
                  <span className="serial-panel-title">Port {panel.index + 1}</span>
                  <select
                    value={panel.baudRate}
                    disabled={panel.isOpen}
                    onChange={(e) => updateSerialBaudRate(panel.index, Number(e.target.value))}
                  >
                    {[9600, 19200, 38400, 57600, 115200].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  {panel.isOpen ? (
                    <button onClick={() => closeSerialPort(panel.index)}>Close</button>
                  ) : (
                    <button onClick={() => openSerialPort(panel.index)}>Open</button>
                  )}
                </div>
                {panel.isOpen && (
                  <>
                    <div className="serial-terminal">
                      {panel.rxLines.length === 0 ? (
                        <span className="serial-terminal-empty">Waiting for data…</span>
                      ) : (
                        panel.rxLines.map((line, i) => <div key={i}>{line}</div>)
                      )}
                    </div>
                    <div className="serial-send-row">
                      <input
                        value={serialSendInputs[panel.index] ?? ''}
                        placeholder="send data…"
                        onChange={(e) => updateSerialSendInput(panel.index, e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') sendSerial(panel.index) }}
                      />
                      <button onClick={() => sendSerial(panel.index)}>Send</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WebBluetooth */}
      <div className="browser-api-section">
        <h3>WebBluetooth</h3>
        <table className="browser-api-table">
          <thead>
            <tr>
              <th>Test</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>API present</td>
              <td><StatusBadge result={results.bluetoothCheck} /></td>
              <td className="browser-api-note">{results.bluetoothCheck.detail}</td>
            </tr>
            <tr>
              <td>getAvailability() — no prompt</td>
              <td><StatusBadge result={results.bluetoothAvailability} /></td>
              <td className="browser-api-note">{results.bluetoothAvailability.detail}</td>
            </tr>
            <tr>
              <td>getDevices() — no prompt</td>
              <td><StatusBadge result={results.bluetoothDevices} /></td>
              <td className="browser-api-note">{results.bluetoothDevices.detail}</td>
            </tr>
            <tr>
              <td>requestDevice()</td>
              <td><span className="status-badge status-gesture_required">GESTURE_REQUIRED</span></td>
              <td className="browser-api-note">Requires user gesture — not auto-tested</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Camera */}
      <div className="browser-api-section">
        <h3>Camera (getUserMedia)</h3>
        <table className="browser-api-table">
          <thead>
            <tr>
              <th>Test</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>API present</td>
              <td><StatusBadge result={results.cameraCheck} /></td>
              <td className="browser-api-note">{results.cameraCheck.detail}</td>
            </tr>
            <tr>
              <td>enumerateDevices() — no prompt</td>
              <td><StatusBadge result={results.cameraDevices} /></td>
              <td className="browser-api-note">{results.cameraDevices.detail}</td>
            </tr>
            <tr>
              <td>getUserMedia() — permission required</td>
              <td><StatusBadge result={results.cameraStream} /></td>
              <td className="browser-api-note">{results.cameraStream.detail}</td>
            </tr>
          </tbody>
        </table>
        <div className="browser-api-buttons">
          {liveStream ? (
            <button onClick={closeCameraPreview}>Close Camera</button>
          ) : (
            <button onClick={openCameraPreview}>Open Camera Preview</button>
          )}
        </div>
      </div>

      {/* Live Hardware Events */}
      <div className="browser-api-section">
        <h3>Live Hardware Events</h3>
        <p className="browser-api-note">USB connect/disconnect events since page load.</p>
        {hardwareEvents.length === 0 ? (
          <p className="browser-api-note">No events yet — plug or unplug a USB device.</p>
        ) : (
          <table className="browser-api-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Device</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {hardwareEvents.map((evt) => (
                <tr key={evt.id}>
                  <td className="browser-api-note">{formatTime(evt.timestamp)}</td>
                  <td>
                    <span className={evt.type === 'usb-connect' ? 'event-usb-connect' : 'event-usb-disconnect'}>
                      {evt.type === 'usb-connect' ? '⬆ connected' : '⬇ disconnected'}
                    </span>
                  </td>
                  <td>{evt.name}</td>
                  <td className="browser-api-note">{evt.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Permissions Policy */}
      <div className="browser-api-section">
        <h3>Permissions Policy</h3>
        <p className="browser-api-note">
          Features allowed in this context (iframe or top-level). Missing entries mean the feature is blocked by policy.
        </p>
        <div className="browser-api-policy">
          {POLICY_FEATURES_TO_CHECK.map((feature) => (
            <span
              key={feature}
              className={`policy-feature ${policyFeatures.includes(feature) ? 'policy-feature-active' : 'policy-feature-inactive'}`}
            >
              {feature} {policyFeatures.includes(feature) ? '✓' : '✗'}
            </span>
          ))}
          {policyFeatures.length === 0 && (
            <span className="browser-api-note">document.featurePolicy / permissionsPolicy not available in this browser</span>
          )}
        </div>
        <div className="browser-api-buttons">
          <button onClick={runAllAutoTests}>Re-run All Tests</button>
        </div>
      </div>
    </div>
  )
}
