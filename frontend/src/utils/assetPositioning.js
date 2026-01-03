export const getRandomPosition = (canvasElements, canvasWidth = 1080, canvasHeight = 1920, assetIndex = 0) => {
  const margin = 50
  const minSize = 250
  const maxSize = 500
  
  const strategicPositions = [
    { x: 100, y: 300, width: 350, height: 350 },
    { x: 150, y: 700, width: 300, height: 300 },
    { x: 100, y: 1200, width: 400, height: 400 },
    { x: 340, y: 400, width: 400, height: 400 },
    { x: 340, y: 900, width: 350, height: 350 },
    { x: 340, y: 1400, width: 300, height: 300 },
    { x: 630, y: 300, width: 350, height: 350 },
    { x: 680, y: 700, width: 300, height: 300 },
    { x: 630, y: 1200, width: 400, height: 400 },
    { x: 200, y: 500, width: 300, height: 300 },
    { x: 580, y: 500, width: 300, height: 300 },
    { x: 390, y: 600, width: 300, height: 300 },
    { x: 100, y: 1000, width: 350, height: 350 },
    { x: 630, y: 1000, width: 350, height: 350 },
    { x: 340, y: 1100, width: 400, height: 400 },
  ]
  
  const checkOverlap = (pos, existing) => {
    for (const elem of existing) {
      const elemRight = elem.x + elem.width + margin
      const elemBottom = elem.y + elem.height + margin
      const posRight = pos.x + pos.width + margin
      const posBottom = pos.y + pos.height + margin
      
      if (!(posRight < elem.x || pos.x > elemRight || posBottom < elem.y || pos.y > elemBottom)) {
        return true
      }
    }
    return false
  }
  
  const usedIndices = new Set()
  for (let i = 0; i < strategicPositions.length; i++) {
    const index = (assetIndex + i) % strategicPositions.length
    if (usedIndices.has(index)) continue
    
    const position = strategicPositions[index]
    if (!checkOverlap(position, canvasElements)) {
      usedIndices.add(index)
      return position
    }
  }
  
  let attempts = 0
  const maxAttempts = 50
  
  while (attempts < maxAttempts) {
    const x = Math.random() * (canvasWidth - maxSize - margin * 2) + margin
    const y = Math.random() * (canvasHeight - maxSize - margin * 2) + 100
    const width = minSize + Math.random() * (maxSize - minSize)
    const height = width
    
    const position = { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) }
    
    if (!checkOverlap(position, canvasElements)) {
      return position
    }
    
    attempts++
  }
  
  const corners = [
    { x: margin, y: 200, width: 350, height: 350 },
    { x: canvasWidth - 400, y: 200, width: 350, height: 350 },
    { x: margin, y: canvasHeight - 550, width: 350, height: 350 },
    { x: canvasWidth - 400, y: canvasHeight - 550, width: 350, height: 350 },
  ]
  
  for (const corner of corners) {
    if (!checkOverlap(corner, canvasElements)) {
      return corner
    }
  }
  
  return {
    x: 200 + (assetIndex * 150) % (canvasWidth - 450),
    y: 300 + (assetIndex * 200) % (canvasHeight - 600),
    width: 400,
    height: 400
  }
}

export const adjustPositionForAspectRatio = (position, aspectRatio) => {
  let { width, height } = position
  
  if (aspectRatio > 1) {
    height = width / aspectRatio
  } else {
    width = height * aspectRatio
  }
  
  return {
    ...position,
    width: Math.round(width),
    height: Math.round(height)
  }
}

