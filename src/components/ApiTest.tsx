import { useState } from 'react'
import {
  accounts,
  users,
  media,
  applications,
  playlist,
  overrides,
  devices,
  proxy,
  weather,
  environment,
} from '@telemetryos/sdk'
import { LogEntry } from '../types'
import './ApiTest.css'

interface ApiTestProps {
  onLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void
}

export function ApiTest({ onLog }: ApiTestProps) {
  const [mediaTag, setMediaTag] = useState('marketing')
  const [mediaFolderId, setMediaFolderId] = useState('')
  const [mediaContentId, setMediaContentId] = useState('')
  const [appMountPoint, setAppMountPoint] = useState('render')
  const [appName, setAppName] = useState('')
  const [playlistDuration, setPlaylistDuration] = useState('30000')
  const [overrideName, setOverrideName] = useState('emergency-alert')
  const [proxyUrl, setProxyUrl] = useState('https://api.github.com/zen')
  const [weatherCity, setWeatherCity] = useState('New York')
  const [weatherUnits, setWeatherUnits] = useState<'imperial' | 'metric'>('imperial')
  const [forecastDays, setForecastDays] = useState('5')
  const [forecastHours, setForecastHours] = useState('24')
  const [appSpecifier, setAppSpecifier] = useState('')

  // Accounts API
  const testAccountsGetCurrent = async () => {
    try {
      const result = await accounts().getCurrent()
      onLog({
        level: 'success',
        method: 'accounts().getCurrent',
        message: `Retrieved current account information`,
        data: result,
      })
      console.log('Accounts getCurrent result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'accounts().getCurrent',
        message: `Failed to get current account: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Accounts getCurrent error:', error)
    }
  }

  // Users API
  const testUsersGetCurrent = async () => {
    try {
      const result = await users().getCurrent()
      onLog({
        level: 'success',
        method: 'users().getCurrent',
        message: `Retrieved current user information`,
        data: result,
      })
      console.log('Users getCurrent result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'users().getCurrent',
        message: `Failed to get current user: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Users getCurrent error:', error)
    }
  }

  // Media API
  const testMediaGetAllFolders = async () => {
    try {
      const result = await media().getAllFolders()
      onLog({
        level: 'success',
        method: 'media().getAllFolders',
        message: `Retrieved all media folders`,
        data: { result },
      })
      console.log('Media getAllFolders result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'media().getAllFolders',
        message: `Failed to get all folders: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Media getAllFolders error:', error)
    }
  }

  const testMediaGetAllByTag = async () => {
    try {
      const result = await media().getAllByTag(mediaTag)
      onLog({
        level: 'success',
        method: 'media().getAllByTag',
        message: `Retrieved media content by tag`,
        data: { tag: mediaTag, result },
      })
      console.log('Media getAllByTag result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'media().getAllByTag',
        message: `Failed to get content by tag: ${error.message}`,
        data: { tag: mediaTag, error: error.message, stack: error.stack },
      })
      console.error('Media getAllByTag error:', error)
    }
  }

  const testMediaGetAllByFolderId = async () => {
    if (!mediaFolderId.trim()) {
      onLog({
        level: 'error',
        method: 'media().getAllByFolderId',
        message: `Please provide a folder ID`,
      })
      return
    }

    try {
      const result = await media().getAllByFolderId(mediaFolderId)
      onLog({
        level: 'success',
        method: 'media().getAllByFolderId',
        message: `Retrieved media content by folder ID`,
        data: { folderId: mediaFolderId, result },
      })
      console.log('Media getAllByFolderId result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'media().getAllByFolderId',
        message: `Failed to get media content: ${error.message}`,
        data: { folderId: mediaFolderId, error: error.message, stack: error.stack },
      })
      console.error('Media getAllByFolderId error:', error)
    }
  }

  const testMediaGetById = async () => {
    if (!mediaContentId.trim()) {
      onLog({
        level: 'error',
        method: 'media().getById',
        message: `Please provide a media content ID`,
      })
      return
    }

    try {
      const result = await media().getById(mediaContentId)
      onLog({
        level: 'success',
        method: 'media().getById',
        message: `Retrieved media content by ID`,
        data: { contentId: mediaContentId, result },
      })
      console.log('Media getById result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'media().getById',
        message: `Failed to get media content: ${error.message}`,
        data: { contentId: mediaContentId, error: error.message, stack: error.stack },
      })
      console.error('Media getById error:', error)
    }
  }

  // Applications API
  const testApplicationsGetAllByMountPoint = async () => {
    if (!appMountPoint.trim()) {
      onLog({
        level: 'error',
        method: 'applications().getAllByMountPoint',
        message: `Please provide a mount point`,
      })
      return
    }

    try {
      const result = await applications().getAllByMountPoint(appMountPoint)
      onLog({
        level: 'success',
        method: 'applications().getAllByMountPoint',
        message: `Retrieved applications by mount point`,
        data: { mountPoint: appMountPoint, result },
      })
      console.log('Applications getAllByMountPoint result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'applications().getAllByMountPoint',
        message: `Failed to get applications: ${error.message}`,
        data: { mountPoint: appMountPoint, error: error.message, stack: error.stack },
      })
      console.error('Applications getAllByMountPoint error:', error)
    }
  }

  const testApplicationsGetByName = async () => {
    if (!appName.trim()) {
      onLog({
        level: 'error',
        method: 'applications().getByName',
        message: `Please provide an application name`,
      })
      return
    }

    try {
      const result = await applications().getByName(appName)
      onLog({
        level: 'success',
        method: 'applications().getByName',
        message: `Retrieved application by name`,
        data: { appName, result },
      })
      console.log('Applications getByName result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'applications().getByName',
        message: `Failed to get application: ${error.message}`,
        data: { appName, error: error.message, stack: error.stack },
      })
      console.error('Applications getByName error:', error)
    }
  }

  const testApplicationsSetDependencies = async () => {
    if (!appSpecifier.trim()) {
      onLog({
        level: 'error',
        method: 'applications().setDependencies',
        message: `Please provide an application specifier`,
      })
      return
    }

    try {
      // setDependencies expects Record<string, string[]>
      // Using a simple example with the specifier as key and empty array as value
      const result = await applications().setDependencies({ [appSpecifier]: [] })
      onLog({
        level: 'success',
        method: 'applications().setDependencies',
        message: `Set application dependencies`,
        data: { specifier: appSpecifier, result },
      })
      console.log('Applications setDependencies result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'applications().setDependencies',
        message: `Failed to set dependencies: ${error.message}`,
        data: { specifier: appSpecifier, error: error.message, stack: error.stack },
      })
      console.error('Applications setDependencies error:', error)
    }
  }

  // Playlist API
  const testPlaylistNextPage = async () => {
    try {
      const result = await playlist().nextPage()
      onLog({
        level: 'success',
        method: 'playlist().nextPage',
        message: `Moved to next playlist page`,
        data: { result },
      })
      console.log('Playlist nextPage result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'playlist().nextPage',
        message: `Failed to move to next page: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Playlist nextPage error:', error)
    }
  }

  const testPlaylistPreviousPage = async () => {
    try {
      const result = await playlist().previousPage()
      onLog({
        level: 'success',
        method: 'playlist().previousPage',
        message: `Moved to previous playlist page`,
        data: { result },
      })
      console.log('Playlist previousPage result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'playlist().previousPage',
        message: `Failed to move to previous page: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Playlist previousPage error:', error)
    }
  }

  const testPlaylistSetDuration = async () => {
    const durationMs = parseInt(playlistDuration)
    if (isNaN(durationMs) || durationMs <= 0) {
      onLog({
        level: 'error',
        method: 'playlist().setDuration',
        message: `Please provide a valid positive duration in milliseconds`,
      })
      return
    }

    try {
      const result = await playlist().setDuration(durationMs)
      onLog({
        level: 'success',
        method: 'playlist().setDuration',
        message: `Set playlist page duration to ${durationMs}ms`,
        data: { durationMs, result },
      })
      console.log('Playlist setDuration result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'playlist().setDuration',
        message: `Failed to set duration: ${error.message}`,
        data: { duration, error: error.message, stack: error.stack },
      })
      console.error('Playlist setDuration error:', error)
    }
  }

  // Devices API
  const testDevicesGetInformation = async () => {
    try {
      const result = await devices().getInformation()
      onLog({
        level: 'success',
        method: 'devices().getInformation',
        message: `Retrieved device information`,
        data: result,
      })
      console.log('Devices getInformation result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'devices().getInformation',
        message: `Failed to get device information: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Devices getInformation error:', error)
    }
  }

  // Proxy API
  const testProxyFetch = async () => {
    if (!proxyUrl.trim()) {
      onLog({
        level: 'error',
        method: 'proxy().fetch',
        message: `Please provide a URL to fetch`,
      })
      return
    }

    try {
      const response = await proxy().fetch(proxyUrl)
      const contentType = response.headers.get('content-type')
      let data: any

      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      onLog({
        level: 'success',
        method: 'proxy().fetch',
        message: `Fetched URL successfully`,
        data: {
          url: proxyUrl,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          contentType,
          data,
        },
      })
      console.log('Proxy fetch result:', { response, data })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'proxy().fetch',
        message: `Failed to fetch URL: ${error.message}`,
        data: { url: proxyUrl, error: error.message, stack: error.stack },
      })
      console.error('Proxy fetch error:', error)
    }
  }

  // Weather API
  const testWeatherGetConditions = async () => {
    if (!weatherCity.trim()) {
      onLog({
        level: 'error',
        method: 'weather().getConditions',
        message: `Please provide a city name`,
      })
      return
    }

    try {
      const result = await weather().getConditions({
        city: weatherCity,
        units: weatherUnits,
      })
      onLog({
        level: 'success',
        method: 'weather().getConditions',
        message: `Retrieved current weather conditions`,
        data: { city: weatherCity, units: weatherUnits, result },
      })
      console.log('Weather getConditions result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'weather().getConditions',
        message: `Failed to get weather conditions: ${error.message}`,
        data: { city: weatherCity, error: error.message, stack: error.stack },
      })
      console.error('Weather getConditions error:', error)
    }
  }

  const testWeatherGetDailyForecast = async () => {
    if (!weatherCity.trim()) {
      onLog({
        level: 'error',
        method: 'weather().getDailyForecast',
        message: `Please provide a city name`,
      })
      return
    }

    const days = parseInt(forecastDays)
    if (isNaN(days) || days <= 0) {
      onLog({
        level: 'error',
        method: 'weather().getDailyForecast',
        message: `Please provide a valid number of days`,
      })
      return
    }

    try {
      const result = await weather().getDailyForecast({
        city: weatherCity,
        units: weatherUnits,
        days,
      })
      onLog({
        level: 'success',
        method: 'weather().getDailyForecast',
        message: `Retrieved ${days}-day weather forecast`,
        data: { city: weatherCity, units: weatherUnits, days, result },
      })
      console.log('Weather getDailyForecast result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'weather().getDailyForecast',
        message: `Failed to get daily forecast: ${error.message}`,
        data: { city: weatherCity, days, error: error.message, stack: error.stack },
      })
      console.error('Weather getDailyForecast error:', error)
    }
  }

  const testWeatherGetHourlyForecast = async () => {
    if (!weatherCity.trim()) {
      onLog({
        level: 'error',
        method: 'weather().getHourlyForecast',
        message: `Please provide a city name`,
      })
      return
    }

    const hours = parseInt(forecastHours)
    if (isNaN(hours) || hours <= 0) {
      onLog({
        level: 'error',
        method: 'weather().getHourlyForecast',
        message: `Please provide a valid number of hours`,
      })
      return
    }

    try {
      const result = await weather().getHourlyForecast({
        city: weatherCity,
        units: weatherUnits,
        hours,
      })
      onLog({
        level: 'success',
        method: 'weather().getHourlyForecast',
        message: `Retrieved ${hours}-hour weather forecast`,
        data: { city: weatherCity, units: weatherUnits, hours, result },
      })
      console.log('Weather getHourlyForecast result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'weather().getHourlyForecast',
        message: `Failed to get hourly forecast: ${error.message}`,
        data: { city: weatherCity, hours, error: error.message, stack: error.stack },
      })
      console.error('Weather getHourlyForecast error:', error)
    }
  }

  // Overrides API
  const testOverridesSetOverride = async () => {
    if (!overrideName.trim()) {
      onLog({
        level: 'error',
        method: 'overrides().setOverride',
        message: `Please provide an override name`,
      })
      return
    }

    try {
      const result = await overrides().setOverride(overrideName)
      onLog({
        level: 'success',
        method: 'overrides().setOverride',
        message: `Set content override`,
        data: { name: overrideName, result },
      })
      console.log('Overrides setOverride result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'overrides().setOverride',
        message: `Failed to set override: ${error.message}`,
        data: { name: overrideName, error: error.message, stack: error.stack },
      })
      console.error('Overrides setOverride error:', error)
    }
  }

  const testOverridesClearOverride = async () => {
    if (!overrideName.trim()) {
      onLog({
        level: 'error',
        method: 'overrides().clearOverride',
        message: `Please provide an override name`,
      })
      return
    }

    try {
      const result = await overrides().clearOverride(overrideName)
      onLog({
        level: 'success',
        method: 'overrides().clearOverride',
        message: `Cleared content override`,
        data: { name: overrideName, result },
      })
      console.log('Overrides clearOverride result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'overrides().clearOverride',
        message: `Failed to clear override: ${error.message}`,
        data: { name: overrideName, error: error.message, stack: error.stack },
      })
      console.error('Overrides clearOverride error:', error)
    }
  }

  // Environment API
  const testEnvironmentGetColorScheme = async () => {
    try {
      const result = await environment().getColorScheme()
      onLog({
        level: 'success',
        method: 'environment().getColorScheme',
        message: `Retrieved current color scheme`,
        data: { colorScheme: result },
      })
      console.log('Environment getColorScheme result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'environment().getColorScheme',
        message: `Failed to get color scheme: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Environment getColorScheme error:', error)
    }
  }

  const testEnvironmentSubscribeColorScheme = async () => {
    try {
      const result = await environment().subscribeColorScheme((colorScheme) => {
        onLog({
          level: 'info',
          method: 'environment().subscribeColorScheme',
          message: `Color scheme changed`,
          data: { colorScheme },
        })
        console.log('Color scheme changed:', colorScheme)
      })
      onLog({
        level: 'success',
        method: 'environment().subscribeColorScheme',
        message: `Subscribed to color scheme changes`,
        data: { success: result },
      })
      console.log('Environment subscribeColorScheme result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'environment().subscribeColorScheme',
        message: `Failed to subscribe to color scheme: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Environment subscribeColorScheme error:', error)
    }
  }

  return (
    <div className="api-test">
      <h2>Other SDK API Tests</h2>
      <p className="api-test-description">
        Test various SDK APIs including accounts, users, media, applications, playlist, and overrides.
      </p>

      {/* Accounts API */}
      <div className="api-test-section">
        <h3>Accounts API</h3>
        <p className="api-test-info">Access account information</p>
        <div className="api-test-buttons">
          <button onClick={testAccountsGetCurrent} className="btn btn-primary">
            Get Current Account
          </button>
        </div>
      </div>

      {/* Users API */}
      <div className="api-test-section">
        <h3>Users API</h3>
        <p className="api-test-info">Access user information</p>
        <div className="api-test-buttons">
          <button onClick={testUsersGetCurrent} className="btn btn-primary">
            Get Current User
          </button>
        </div>
      </div>

      {/* Media API */}
      <div className="api-test-section">
        <h3>Media API</h3>
        <p className="api-test-info">Access media content and folders</p>
        <div className="api-test-buttons">
          <button onClick={testMediaGetAllFolders} className="btn btn-primary">
            Get All Folders
          </button>
        </div>
        <div className="api-test-input-group">
          <label>
            Tag:
            <input
              type="text"
              value={mediaTag}
              onChange={(e) => setMediaTag(e.target.value)}
              placeholder="Enter tag (e.g., marketing)"
              className="api-test-input"
            />
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={testMediaGetAllByTag} className="btn btn-primary">
            Get Content By Tag
          </button>
        </div>
        <div className="api-test-input-group">
          <label>
            Folder ID:
            <input
              type="text"
              value={mediaFolderId}
              onChange={(e) => setMediaFolderId(e.target.value)}
              placeholder="Enter folder ID"
              className="api-test-input"
            />
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={testMediaGetAllByFolderId} className="btn btn-primary">
            Get Content By Folder ID
          </button>
        </div>
        <div className="api-test-input-group">
          <label>
            Media Content ID:
            <input
              type="text"
              value={mediaContentId}
              onChange={(e) => setMediaContentId(e.target.value)}
              placeholder="Enter media content ID"
              className="api-test-input"
            />
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={testMediaGetById} className="btn btn-primary">
            Get Content By ID
          </button>
        </div>
      </div>

      {/* Applications API */}
      <div className="api-test-section">
        <h3>Applications API</h3>
        <p className="api-test-info">Discover and embed other applications</p>
        <div className="api-test-input-group">
          <label>
            Mount Point:
            <input
              type="text"
              value={appMountPoint}
              onChange={(e) => setAppMountPoint(e.target.value)}
              placeholder="Enter mount point (e.g., render)"
              className="api-test-input"
            />
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={testApplicationsGetAllByMountPoint} className="btn btn-primary">
            Get All By Mount Point
          </button>
        </div>
        <div className="api-test-input-group">
          <label>
            Application Name:
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Enter app name"
              className="api-test-input"
            />
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={testApplicationsGetByName} className="btn btn-primary">
            Get By Name
          </button>
        </div>
        <div className="api-test-input-group">
          <label>
            Application Specifier:
            <input
              type="text"
              value={appSpecifier}
              onChange={(e) => setAppSpecifier(e.target.value)}
              placeholder="Enter app specifier (40-char hex)"
              className="api-test-input"
            />
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={testApplicationsSetDependencies} className="btn btn-primary">
            Set Dependencies
          </button>
        </div>
      </div>

      {/* Playlist API */}
      <div className="api-test-section">
        <h3>Playlist API</h3>
        <p className="api-test-info">Control playlist navigation and timing</p>
        <div className="api-test-buttons">
          <button onClick={testPlaylistNextPage} className="btn btn-primary">
            Next Page
          </button>
          <button onClick={testPlaylistPreviousPage} className="btn btn-secondary">
            Previous Page
          </button>
        </div>
        <div className="api-test-input-group">
          <label>
            Duration (ms):
            <input
              type="number"
              value={playlistDuration}
              onChange={(e) => setPlaylistDuration(e.target.value)}
              placeholder="Enter duration in milliseconds"
              className="api-test-input"
              min="1"
            />
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={testPlaylistSetDuration} className="btn btn-primary">
            Set Duration
          </button>
        </div>
      </div>

      {/* Devices API */}
      <div className="api-test-section">
        <h3>Devices API</h3>
        <p className="api-test-info">Access device hardware information</p>
        <div className="api-test-buttons">
          <button onClick={testDevicesGetInformation} className="btn btn-primary">
            Get Device Information
          </button>
        </div>
      </div>

      {/* Proxy API */}
      <div className="api-test-section">
        <h3>Proxy API</h3>
        <p className="api-test-info">Fetch external content through TelemetryOS proxy</p>
        <div className="api-test-input-group">
          <label>
            URL:
            <input
              type="text"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              placeholder="Enter URL to fetch"
              className="api-test-input"
            />
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={testProxyFetch} className="btn btn-primary">
            Fetch URL
          </button>
        </div>
      </div>

      {/* Weather API */}
      <div className="api-test-section">
        <h3>Weather API</h3>
        <p className="api-test-info">Access weather conditions and forecasts</p>
        <div className="api-test-input-group">
          <label>
            City:
            <input
              type="text"
              value={weatherCity}
              onChange={(e) => setWeatherCity(e.target.value)}
              placeholder="Enter city name"
              className="api-test-input"
            />
          </label>
          <label>
            Units:
            <select
              value={weatherUnits}
              onChange={(e) => setWeatherUnits(e.target.value as 'imperial' | 'metric')}
              className="api-test-input"
            >
              <option value="imperial">Imperial (°F, mph)</option>
              <option value="metric">Metric (°C, km/h)</option>
            </select>
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={testWeatherGetConditions} className="btn btn-primary">
            Get Current Conditions
          </button>
        </div>
        <div className="api-test-input-group">
          <label>
            Forecast Days:
            <input
              type="number"
              value={forecastDays}
              onChange={(e) => setForecastDays(e.target.value)}
              placeholder="Number of days"
              className="api-test-input"
              min="1"
              max="16"
            />
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={testWeatherGetDailyForecast} className="btn btn-primary">
            Get Daily Forecast
          </button>
        </div>
        <div className="api-test-input-group">
          <label>
            Forecast Hours:
            <input
              type="number"
              value={forecastHours}
              onChange={(e) => setForecastHours(e.target.value)}
              placeholder="Number of hours"
              className="api-test-input"
              min="1"
              max="120"
            />
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={testWeatherGetHourlyForecast} className="btn btn-primary">
            Get Hourly Forecast
          </button>
        </div>
      </div>

      {/* Overrides API */}
      <div className="api-test-section">
        <h3>Overrides API</h3>
        <p className="api-test-info">Manage content overrides</p>
        <div className="api-test-input-group">
          <label>
            Override Name:
            <input
              type="text"
              value={overrideName}
              onChange={(e) => setOverrideName(e.target.value)}
              placeholder="Enter override name"
              className="api-test-input"
            />
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={testOverridesSetOverride} className="btn btn-primary">
            Set Override
          </button>
          <button onClick={testOverridesClearOverride} className="btn btn-danger">
            Clear Override
          </button>
        </div>
      </div>

      {/* Environment API */}
      <div className="api-test-section">
        <h3>Environment API</h3>
        <p className="api-test-info">Access environment settings like color scheme</p>
        <div className="api-test-buttons">
          <button onClick={testEnvironmentGetColorScheme} className="btn btn-primary">
            Get Color Scheme
          </button>
          <button onClick={testEnvironmentSubscribeColorScheme} className="btn btn-secondary">
            Subscribe to Color Scheme
          </button>
        </div>
      </div>
    </div>
  )
}

