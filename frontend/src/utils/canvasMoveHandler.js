export const createMoveIcon = (x, y, width, height) => {
  const iconSize = 20
  const iconX = width - iconSize - 4
  const iconY = 4
  
  return {
    x: iconX,
    y: iconY,
    width: iconSize,
    height: iconSize
  }
}

export const handleElementMove = (elementId, elementRefs, scale, updateElement) => {
  const node = elementRefs.current[elementId]
  if (!node) return
  
  const stage = node.getStage()
  if (!stage) return
  
  const pointerPos = stage.getPointerPosition()
  if (!pointerPos) return
  
  const newX = pointerPos.x / scale
  const newY = pointerPos.y / scale
  
  updateElement(elementId, {
    x: newX,
    y: newY
  })
  
  node.position({
    x: pointerPos.x,
    y: pointerPos.y
  })
}

export const startDragOnElement = (elementId, elementRefs) => {
  setTimeout(() => {
    const node = elementRefs.current[elementId]
    if (node && node.draggable()) {
      const stage = node.getStage()
      if (stage) {
        const pointerPos = stage.getPointerPosition()
        if (pointerPos) {
          node.position(pointerPos)
          node.startDrag()
        }
      }
    }
  }, 10)
}

