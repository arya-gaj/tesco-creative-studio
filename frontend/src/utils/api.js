const API_URL_KEY = 'backend_api_url'

export const getApiUrl = () => {
  const stored = localStorage.getItem(API_URL_KEY)
  if (stored) {
    return stored.replace(/\/$/, '')
  }
  return null
}

export const setApiUrl = (url) => {
  const cleanUrl = url.replace(/\/$/, '')
  localStorage.setItem(API_URL_KEY, cleanUrl)
  return cleanUrl
}

export const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = getApiUrl()
  if (!baseUrl) {
    throw new Error('Backend API URL not configured. Please set it in settings.')
  }

  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API Error (${response.status}): ${errorText}`)
  }

  return response.json()
}

export const generateCreative = async (prompt) => {
  const response = await apiRequest('/generate', {
    method: 'POST',
    body: JSON.stringify({ text: prompt }),
  })
  return {
    background_url: response.background_url || (response.background_base64 ? `data:image/png;base64,${response.background_base64}` : null),
    layout: response.layout || {}
  }
}

export const verifyCanvas = async (canvasState) => {
  return apiRequest('/verify', {
    method: 'POST',
    body: JSON.stringify({ canvas_state: canvasState }),
  })
}

export const fetchAssets = async (query) => {
  return apiRequest(`/assets?query=${encodeURIComponent(query)}`, {
    method: 'GET',
  })
}
