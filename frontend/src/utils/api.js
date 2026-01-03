export const getApiUrl = () => {
  return 'http://localhost:8000'
}

export const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = getApiUrl()
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  
  const method = options.method || 'GET'
  const hasBody = options.body !== undefined && options.body !== null
  
  const requestOptions = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  if (hasBody && method !== 'GET' && method !== 'HEAD') {
    requestOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
  }

  console.log(`[API] ${method} ${url}`, hasBody ? requestOptions.body : '')

  const response = await fetch(url, requestOptions)

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `API Error (${response.status}): ${errorText}`
    
    if (response.status === 404) {
      errorMessage = `404 Not Found: ${url}\n\n` +
        `The endpoint "${endpoint}" was not found on the backend.\n\n` +
        `Possible fixes:\n` +
        `1. Verify the endpoint path is correct (check ${baseUrl}/docs)\n` +
        `2. Ensure HTTP method is correct (using ${method})\n` +
        `3. Check if backend is running on ${baseUrl || 'localhost:8000'}\n` +
        `4. Verify backend exposes: POST /generate, GET /assets/*, GET /\n\n` +
        `Full URL attempted: ${url}`
    }
    
    throw new Error(errorMessage)
  }

  return response.json()
}

export const generateCreative = async (prompt) => {
  if (!prompt || !prompt.trim()) {
    throw new Error('Prompt is required')
  }
  
  const response = await apiRequest('/generate', {
    method: 'POST',
    body: { prompt: prompt.trim() },
  })
  return response
}

export const getAssetUrl = (assetPath) => {
  const baseUrl = getApiUrl()
  if (!baseUrl) {
    return assetPath
  }
  
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath
  }
  
  if (assetPath.startsWith('/assets')) {
    return `${baseUrl}${assetPath}`
  }
  
  return `${baseUrl}/assets/${assetPath}`
}

export const verifyAndCommit = async (canvasState, metadata = null) => {
  try {
    const response = await apiRequest('/verify', {
      method: 'POST',
      body: {
        canvas_state: canvasState,
        metadata: metadata
      },
    })
    return response
  } catch (error) {
    console.warn('Verify endpoint not available:', error.message)
    return { hash: 'N/A', block_id: 'N/A', message: 'Verification endpoint not implemented' }
  }
}

export const removeBackground = async (imageBase64) => {
  try {
    const response = await apiRequest('/remove-background', {
      method: 'POST',
      body: {
        image_base64: imageBase64
      },
    })
    return response
  } catch (error) {
    console.error('Background removal failed:', error.message)
    throw error
  }
}

export const getAssetInfo = async (assetUrl) => {
  try {
    const path = assetUrl.replace('http://localhost:8000', '').replace('http://127.0.0.1:8000', '')
    const response = await apiRequest(`/asset-info?path=${encodeURIComponent(path)}`, {
      method: 'GET',
    })
    return response
  } catch (error) {
    console.error('[API] Failed to get asset info:', error.message)
    return { description: null, category: null }
  }
}

export const getAssetPosition = async (canvasElements, assetUrl, assetDescription, assetCategory, canvasWidth = 1080, canvasHeight = 1920) => {
  try {
    console.log('[API] Requesting strategic position for asset:', assetUrl)
    console.log('[API] Asset description:', assetDescription)
    console.log('[API] Asset category:', assetCategory)
    console.log('[API] Canvas elements:', canvasElements.length)
    const response = await apiRequest('/asset-position', {
      method: 'POST',
      body: {
        canvas_elements: canvasElements,
        asset_url: assetUrl,
        asset_description: assetDescription,
        asset_category: assetCategory,
        canvas_width: canvasWidth,
        canvas_height: canvasHeight
      },
    })
    console.log('[API] Received strategic position:', response)
    return response
  } catch (error) {
    console.error('[API] Asset positioning failed:', error.message)
    console.error('[API] Error details:', error)
    return { x: 200, y: 200, width: 400, height: 400 }
  }
}
