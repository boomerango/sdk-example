export function stringifyValue(value: any) {
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return value
}

export function parseValue(value: string) {
  try {
    return JSON.parse(value)
  } catch (error) {
    return value
  }
}

export function getInstanceId() {
  try {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('applicationInstance')
  } catch (error) {
    return null
  }
}
