import { useState, useEffect } from 'react'
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
        data: { count: devices.length, devices: devices.map((d) => ({ name: d.productName, vendor: d.vendorId })) },
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

  const testCameraStream = async () => {
    if (!('mediaDevices' in navigator)) {
      setResults((prev) => ({ ...prev, cameraStream: { status: 'UNAVAILABLE', detail: 'navigator.mediaDevices not present' } }))
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((t) => t.stop())
      setResults((prev) => ({ ...prev, cameraStream: { status: 'GRANTED', detail: 'Stream acquired and released' } }))
      onLog({ level: 'success', method: 'navigator.mediaDevices.getUserMedia', message: 'Camera access granted — stream released immediately' })
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

  function mountEffect() {
    runAllAutoTests()
  }

  useEffect(mountEffect, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="browser-api-test">
      <h2>Browser Hardware APIs</h2>
      <p className="browser-api-test-description">
        Tests WebUSB, WebSerial, WebBluetooth, and Camera availability — no user gesture required for read operations.
        Connect/requestDevice operations require a user gesture and are not tested automatically.
      </p>
      <div className="browser-api-platform">Platform: {platform}</div>

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
          <button onClick={testCameraStream}>Test Camera Stream</button>
        </div>
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
