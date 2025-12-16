import { store as sdkStore } from '@telemetryos/sdk'

import type { SdkStoreScope } from '../types'
import { parseValue, stringifyValue, getInstanceId } from './util'

// Note: configure() must be called before using these functions
// It should be called early in your app (e.g., in index.tsx or StoreTest.tsx)

export async function sendStoreValue({ key, value, scope = 'instance' }: { key: string, value: any, scope?: SdkStoreScope }) {
  const sanitizedValue = stringifyValue(value)
  try {
    switch (scope) {
      case 'application':
        console.log(`SDK: call store().application.set('${key}', '${sanitizedValue}')`)
        await sdkStore().application.set(key, sanitizedValue)
        break
      case 'device':
        console.log(`SDK: call store().device.set('${key}', '${sanitizedValue}')`)
        await sdkStore().device.set(key, sanitizedValue)
        break
      case 'instance':
        console.log(`SDK: call store().instance.set('${key}', '${sanitizedValue}') [${getInstanceId()}]`)
        await sdkStore().instance.set(key, sanitizedValue)
        break
    }
    console.log(`SDK: finished sending "${key} = ${sanitizedValue}" to "${scope}" store`)
    return true
  } catch (error) {
    console.error(`SDK: error sending "${key} = ${sanitizedValue}" to "${scope}" store:`, error)
    throw error
  }
}

export async function getStoreValue({ key, scope = 'instance' }: { key: string, scope?: SdkStoreScope }) {
  key = (key || '').trim()

  if (!key) return undefined

  try {
    let value: any
    switch (scope) {
      case 'application':
        console.log(`SDK: call store().application.get('${key}')`)
        value = await sdkStore().application.get(key)
        break
      case 'device':
        console.log(`SDK: call store().device.get('${key}')`)
        value = await sdkStore().device.get(key)
        break
      case 'instance':
        console.log(`SDK: call store().instance.get('${key}') [${getInstanceId()}]`)
        value = await sdkStore().instance.get(key)
        break
    }
    const parsedValue = parseValue(value || '')
    console.log(`SDK: finished retrieving "${key}" from "${scope}" store =`, parsedValue)
    return parsedValue
  } catch (error) {
    console.error(`SDK: error retrieving "${key}" from "${scope}" store:`, error)
    throw error
  }
}

export async function clearStoreValue({ key, scope = 'instance' }: { key: string, scope?: SdkStoreScope }) {
  key = (key || '').trim()

  if (!key) return false

  try {
    switch (scope) {
      case 'application':
        console.log(`SDK: call store().application.delete('${key}')`)
        await sdkStore().application.delete(key)
        break
      case 'device':
        console.log(`SDK: call store().device.delete('${key}')`)
        await sdkStore().device.delete(key)
        break
      case 'instance':
        console.log(`SDK: call store().instance.delete('${key}') [${getInstanceId()}]`)
        await sdkStore().instance.delete(key)
        break
    }
    console.log(`SDK: finished clearing "${key}" from "${scope}" store`)
    return true
  } catch (error) {
    console.error(`SDK: error clearing "${key}" from "${scope}" store:`, error)
    throw error
  }
}

export async function subscribeToStoreValue({ key, scope = 'instance', callback }: { key: string, scope?: SdkStoreScope, callback: (value: any) => void }) {
  key = (key || '').trim()

  if (!key) return false

  try {
    switch (scope) {
      case 'application':
        console.log(`SDK: call store().application.subscribe('${key}', callback)`)
        await sdkStore().application.subscribe(key, callback)
        break
      case 'device':
        console.log(`SDK: call store().device.subscribe('${key}', callback)`)
        await sdkStore().device.subscribe(key, callback)
        break
      case 'instance':
        console.log(`SDK: call store().instance.subscribe('${key}', callback) [${getInstanceId()}]`)
        await sdkStore().instance.subscribe(key, callback)
        break
    }
    console.log(`SDK: finished subscribing to "${key}" from "${scope}" store`)
    return true
  } catch (error) {
    console.error(`SDK: error subscribing to "${key}" from "${scope}" store:`, error)
    throw error
  }
}

export async function unsubscribeFromStoreValue({ key, scope = 'instance', callback }: { key: string, scope?: SdkStoreScope, callback: (value: any) => void }) {
  key = (key || '').trim()

  if (!key) return false

  try {
    switch (scope) {
      case 'application':
        console.log(`SDK: call store().application.unsubscribe('${key}', callback)`)
        await sdkStore().application.unsubscribe(key, callback)
        break
      case 'device':
        console.log(`SDK: call store().device.unsubscribe('${key}', callback)`)
        await sdkStore().device.unsubscribe(key, callback)
        break
      case 'instance':
        console.log(`SDK: call store().instance.unsubscribe('${key}', callback) [${getInstanceId()}]`)
        await sdkStore().instance.unsubscribe(key, callback)
        break
    }
    console.log(`SDK: finished unsubscribing from "${key}" from "${scope}" store`)
    return true
  } catch (error) {
    console.error(`SDK: error unsubscribing from "${key}" from "${scope}" store:`, error)
    throw error
  }
}

// Shared namespace functions
export async function sendSharedStoreValue({ namespace, key, value }: { namespace: string, key: string, value: any }) {
  const sanitizedValue = stringifyValue(value)
  try {
    console.log(`SDK: call store().shared('${namespace}').set('${key}', '${sanitizedValue}')`)
    await sdkStore().shared(namespace).set(key, sanitizedValue)
    console.log(`SDK: finished sending "${key} = ${sanitizedValue}" to shared("${namespace}") store`)
    return true
  } catch (error) {
    console.error(`SDK: error sending "${key} = ${sanitizedValue}" to shared("${namespace}") store:`, error)
    throw error
  }
}

export async function getSharedStoreValue({ namespace, key }: { namespace: string, key: string }) {
  key = (key || '').trim()

  if (!key) return undefined

  try {
    console.log(`SDK: call store().shared('${namespace}').get('${key}')`)
    const value = await sdkStore().shared(namespace).get(key)
    const parsedValue = parseValue(value || '')
    console.log(`SDK: finished retrieving "${key}" from shared("${namespace}") store =`, parsedValue)
    return parsedValue
  } catch (error) {
    console.error(`SDK: error retrieving "${key}" from shared("${namespace}") store:`, error)
    throw error
  }
}

export async function clearSharedStoreValue({ namespace, key }: { namespace: string, key: string }) {
  key = (key || '').trim()

  if (!key) return false

  try {
    console.log(`SDK: call store().shared('${namespace}').delete('${key}')`)
    await sdkStore().shared(namespace).delete(key)
    console.log(`SDK: finished clearing "${key}" from shared("${namespace}") store`)
    return true
  } catch (error) {
    console.error(`SDK: error clearing "${key}" from shared("${namespace}") store:`, error)
    throw error
  }
}

export async function subscribeToSharedStoreValue({ namespace, key, callback }: { namespace: string, key: string, callback: (value: any) => void }) {
  key = (key || '').trim()

  if (!key) return false

  try {
    console.log(`SDK: call store().shared('${namespace}').subscribe('${key}', callback)`)
    await sdkStore().shared(namespace).subscribe(key, callback)
    console.log(`SDK: finished subscribing to "${key}" from shared("${namespace}") store`)
    return true
  } catch (error) {
    console.error(`SDK: error subscribing to "${key}" from shared("${namespace}") store:`, error)
    throw error
  }
}

export async function unsubscribeFromSharedStoreValue({ namespace, key, callback }: { namespace: string, key: string, callback: (value: any) => void }) {
  key = (key || '').trim()

  if (!key) return false

  try {
    console.log(`SDK: call store().shared('${namespace}').unsubscribe('${key}', callback)`)
    await sdkStore().shared(namespace).unsubscribe(key, callback)
    console.log(`SDK: finished unsubscribing from "${key}" from shared("${namespace}") store`)
    return true
  } catch (error) {
    console.error(`SDK: error unsubscribing from "${key}" from shared("${namespace}") store:`, error)
    throw error
  }
}
