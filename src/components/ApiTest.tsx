import { useState, useEffect, useRef, useCallback } from 'react'
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
  const activeOverrideNameRef = useRef<string | null>(null)
  const overrideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [weatherCitySearch, setWeatherCitySearch] = useState('New York')
  const [weatherCityId, setWeatherCityId] = useState('')
  const [weatherCityLabel, setWeatherCityLabel] = useState('')
  const [forecastDays, setForecastDays] = useState('5')
  const [forecastHours, setForecastHours] = useState('24')
  const [appSpecifier, setAppSpecifier] = useState('')

  const clearActiveOverride = useCallback(async () => {
    const name = activeOverrideNameRef.current
    if (!name) {
      onLog({
        level: 'error',
        method: 'overrides().clearOverride',
        message: 'No active override to clear (set an override first)',
      })
      return
    }

    try {
      const result = await overrides().clearOverride(name)
      activeOverrideNameRef.current = null
      if (overrideTimerRef.current) {
        clearTimeout(overrideTimerRef.current)
        overrideTimerRef.current = null
      }
      onLog({
        level: 'success',
        method: 'overrides().clearOverride',
        message: `Cleared override via keyboard shortcut`,
        data: { name, result },
      })
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'overrides().clearOverride',
        message: `Failed to clear override: ${error.message}`,
        data: { name, error: error.message },
      })
    }
  }, [onLog])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const isClearShortcut =
        (e.key === 'l' && (e.metaKey || e.ctrlKey)) || (e.key === 'q' && !e.metaKey && !e.ctrlKey && !e.altKey)

      if (isClearShortcut) {
        e.preventDefault()
        clearActiveOverride()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clearActiveOverride])

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

  const testPlaylistGetDuration = async () => {
    try {
      const result = await playlist().getDuration()
      onLog({
        level: 'success',
        method: 'playlist().getDuration',
        message: `Retrieved playlist page duration`,
        data: { result },
      })
      console.log('Playlist getDuration result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'playlist().getDuration',
        message: `Failed to get duration: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Playlist getDuration error:', error)
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
        data: { durationMs, error: error.message, stack: error.stack },
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
  const testWeatherGetCities = async () => {
    if (!weatherCitySearch.trim()) {
      onLog({
        level: 'error',
        method: 'weather().getCities',
        message: `Please provide a city name to search`,
      })
      return
    }

    try {
      const result = await weather().getCities({ search: weatherCitySearch })
      if (result.length > 0) {
        const city = result[0]
        setWeatherCityId(String(city.cityId))
        setWeatherCityLabel(`${city.cityName}, ${city.countryCode}`)
      }
      onLog({
        level: 'success',
        method: 'weather().getCities',
        message: `Found ${result.length} cities`,
        data: { search: weatherCitySearch, result },
      })
      console.log('Weather getCities result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'weather().getCities',
        message: `Failed to search cities: ${error.message}`,
        data: { search: weatherCitySearch, error: error.message, stack: error.stack },
      })
      console.error('Weather getCities error:', error)
    }
  }

  const requireCityId = (method: string): number | null => {
    const cityId = parseInt(weatherCityId)
    if (!weatherCityId.trim() || isNaN(cityId)) {
      onLog({
        level: 'error',
        method,
        message: `Please search for a city first to get a cityId`,
      })
      return null
    }
    return cityId
  }

  const testWeatherGetConditions = async () => {
    const cityId = requireCityId('weather().getConditions')
    if (!cityId) return

    try {
      const result = await weather().getConditions({ cityId })
      onLog({
        level: 'success',
        method: 'weather().getConditions',
        message: `Retrieved current weather conditions`,
        data: { cityId, result },
      })
      console.log('Weather getConditions result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'weather().getConditions',
        message: `Failed to get weather conditions: ${error.message}`,
        data: { cityId, error: error.message, stack: error.stack },
      })
      console.error('Weather getConditions error:', error)
    }
  }

  const testWeatherGetDailyForecast = async () => {
    const cityId = requireCityId('weather().getDailyForecast')
    if (!cityId) return

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
      const result = await weather().getDailyForecast({ cityId, days })
      onLog({
        level: 'success',
        method: 'weather().getDailyForecast',
        message: `Retrieved ${days}-day weather forecast`,
        data: { cityId, days, result },
      })
      console.log('Weather getDailyForecast result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'weather().getDailyForecast',
        message: `Failed to get daily forecast: ${error.message}`,
        data: { cityId, days, error: error.message, stack: error.stack },
      })
      console.error('Weather getDailyForecast error:', error)
    }
  }

  const testWeatherGetHourlyForecast = async () => {
    const cityId = requireCityId('weather().getHourlyForecast')
    if (!cityId) return

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
      const result = await weather().getHourlyForecast({ cityId, hours })
      onLog({
        level: 'success',
        method: 'weather().getHourlyForecast',
        message: `Retrieved ${hours}-hour weather forecast`,
        data: { cityId, hours, result },
      })
      console.log('Weather getHourlyForecast result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'weather().getHourlyForecast',
        message: `Failed to get hourly forecast: ${error.message}`,
        data: { cityId, hours, error: error.message, stack: error.stack },
      })
      console.error('Weather getHourlyForecast error:', error)
    }
  }

  const testWeatherGetAlerts = async () => {
    const cityId = requireCityId('weather().getAlerts')
    if (!cityId) return

    try {
      const result = await weather().getAlerts({ cityId })
      onLog({
        level: 'success',
        method: 'weather().getAlerts',
        message: `Retrieved ${result.alerts.length} weather alerts`,
        data: { cityId, result },
      })
      console.log('Weather getAlerts result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'weather().getAlerts',
        message: `Failed to get weather alerts: ${error.message}`,
        data: { cityId, error: error.message, stack: error.stack },
      })
      console.error('Weather getAlerts error:', error)
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
      activeOverrideNameRef.current = overrideName

      // Auto-clear the override after 30 seconds
      if (overrideTimerRef.current) {
        clearTimeout(overrideTimerRef.current)
      }
      const nameToAutoClear = overrideName
      overrideTimerRef.current = setTimeout(async () => {
        overrideTimerRef.current = null
        if (activeOverrideNameRef.current === nameToAutoClear) {
          try {
            await overrides().clearOverride(nameToAutoClear)
            activeOverrideNameRef.current = null
            onLog({
              level: 'info',
              method: 'overrides().clearOverride',
              message: `Auto-cleared override after 30s`,
              data: { name: nameToAutoClear },
            })
          } catch (error: any) {
            onLog({
              level: 'error',
              method: 'overrides().clearOverride',
              message: `Failed to auto-clear override: ${error.message}`,
              data: { name: nameToAutoClear, error: error.message },
            })
          }
        }
      }, 30_000)

      onLog({
        level: 'success',
        method: 'overrides().setOverride',
        message: `Set content override (will auto-clear in 30s)`,
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
      if (overrideTimerRef.current) {
        clearTimeout(overrideTimerRef.current)
        overrideTimerRef.current = null
      }
      activeOverrideNameRef.current = null
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

  const testEnvironmentUnsubscribeColorScheme = async () => {
    try {
      const result = await environment().unsubscribeColorScheme()
      onLog({
        level: 'success',
        method: 'environment().unsubscribeColorScheme',
        message: `Unsubscribed from color scheme changes`,
        data: { success: result },
      })
      console.log('Environment unsubscribeColorScheme result:', result)
    } catch (error: any) {
      onLog({
        level: 'error',
        method: 'environment().unsubscribeColorScheme',
        message: `Failed to unsubscribe from color scheme: ${error.message}`,
        data: { error: error.message, stack: error.stack },
      })
      console.error('Environment unsubscribeColorScheme error:', error)
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
          <button onClick={testPlaylistGetDuration} className="btn btn-secondary">
            Get Duration
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
        <p className="api-test-info">Search for a city first to get a cityId, then use it for conditions, forecasts, and alerts</p>
        <div className="api-test-input-group">
          <label>
            City Search:
            <input
              type="text"
              value={weatherCitySearch}
              onChange={(e) => setWeatherCitySearch(e.target.value)}
              placeholder="Enter city name (e.g., New York)"
              className="api-test-input"
            />
          </label>
        </div>
        <div className="api-test-buttons">
          <button onClick={testWeatherGetCities} className="btn btn-primary">
            Search Cities
          </button>
        </div>
        <div className="api-test-input-group">
          <label>
            City ID:
            <input
              type="text"
              value={weatherCityId}
              onChange={(e) => setWeatherCityId(e.target.value)}
              placeholder="Auto-filled from search, or enter manually"
              className="api-test-input"
            />
          </label>
          {weatherCityLabel && (
            <span className="api-test-info">{weatherCityLabel}</span>
          )}
        </div>
        <div className="api-test-buttons">
          <button onClick={testWeatherGetConditions} className="btn btn-primary">
            Get Current Conditions
          </button>
          <button onClick={testWeatherGetAlerts} className="btn btn-secondary">
            Get Alerts
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
        <p className="api-test-info">Manage content overrides (Clear: Ctrl/Cmd+L or Q)</p>
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
          <button onClick={testEnvironmentUnsubscribeColorScheme} className="btn btn-secondary">
            Unsubscribe from Color Scheme
          </button>
        </div>
      </div>
    </div>
  )
}

