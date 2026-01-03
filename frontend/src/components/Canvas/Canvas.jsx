import { Stage, Layer, Rect, Image as KonvaImage, Transformer, Group, Line, Text as KonvaText, Circle, Shape } from 'react-konva'
import useImage from 'use-image'
import { useState, useEffect, useRef, useCallback } from 'react'
import EditToolbar from './EditToolbar'
import PropertiesPanel from './PropertiesPanel'
import { removeBackground, getAssetPosition, getAssetInfo } from '../../utils/api'
import { getRandomPosition, adjustPositionForAspectRatio } from '../../utils/assetPositioning'

export default function Canvas({ imageBase64, onCanvasStateChange, selectedAsset, onAssetAdded }) {
  const [scale, setScale] = useState(1)
  const [stageSize, setStageSize] = useState({ width: 1080, height: 1920 })
  const containerRef = useRef(null)
  const stageRef = useRef(null)

  const [backgroundImage, imageStatus] = useImage(imageBase64 || null)
  
  useEffect(() => {
    if (imageBase64) {
      console.log('[Canvas] ImageBase64 received:', imageBase64.substring(0, 50) + '...')
    }
    if (backgroundImage) {
      console.log('[Canvas] Background image loaded:', backgroundImage.width, 'x', backgroundImage.height)
    }
    if (imageStatus === 'failed') {
      console.error('[Canvas] Failed to load background image')
    }
  }, [imageBase64, backgroundImage, imageStatus])
  
  const [elements, setElements] = useState([])
  const [selectedElementId, setSelectedElementId] = useState(null)
  const [productImage, setProductImage] = useState(null)
  const [activeTool, setActiveTool] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentShape, setCurrentShape] = useState(null)
  const [drawingPoints, setDrawingPoints] = useState([])
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#ffffff')
  
  const transformerRef = useRef(null)
  const elementRefs = useRef({})
  const lastAssetUrlRef = useRef(null)

  const handleMouseEnter = (e) => {
    if (!activeTool || activeTool === 'select') {
      const stage = e.target.getStage()
      if (stage && stage.content()) {
        stage.content().style.cursor = 'move'
      }
    }
  }

  const handleMouseLeave = (e) => {
    const stage = e.target.getStage()
    if (stage && stage.content()) {
      stage.content().style.cursor = 'default'
    }
  }

  useEffect(() => {
    if (selectedAsset && selectedAsset.url) {
      const assetUrl = selectedAsset.url
      
      if (lastAssetUrlRef.current === assetUrl) {
        return
      }
      
      lastAssetUrlRef.current = assetUrl
      console.log('[Canvas] Loading asset:', assetUrl)
      
      const img = new window.Image()
      img.src = assetUrl
      
      img.onload = async () => {
        console.log('[Canvas] Image loaded successfully')
        
        const canvasElements = elements.map(el => ({
          type: el.type,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height
        }))
        
        const imageCount = elements.filter(el => el.type === 'image').length
        
        try {
          console.log('[Canvas] Fetching asset metadata...')
          const assetInfo = await getAssetInfo(assetUrl)
          console.log('[Canvas] Asset info:', assetInfo)
          
          console.log('[Canvas] Requesting strategic position from Claude API...')
          let position
          try {
            position = await getAssetPosition(
              canvasElements,
              assetUrl,
              assetInfo.description || null,
              assetInfo.category || null,
              stageSize.width,
              stageSize.height
            )
            console.log('[Canvas] Received strategic position from Claude:', position)
          } catch (apiError) {
            console.warn('[Canvas] Claude API failed, using random positioning:', apiError)
            position = null
          }
          
          const checkClaudePosition = (pos) => {
            if (!pos || !pos.x || !pos.y) return false
            for (const elem of canvasElements) {
              const margin = 50
              const elemRight = elem.x + elem.width + margin
              const elemBottom = elem.y + elem.height + margin
              const posRight = pos.x + (pos.width || 400) + margin
              const posBottom = pos.y + (pos.height || 400) + margin
              
              if (!(posRight < elem.x || pos.x > elemRight || posBottom < elem.y || pos.y > elemBottom)) {
                return false
              }
            }
            return true
          }
          
          if (!position || !position.x || !position.y || !checkClaudePosition(position)) {
            console.log('[Canvas] Using random positioning for asset index:', imageCount)
            const randomPos = getRandomPosition(canvasElements, stageSize.width, stageSize.height, imageCount)
            position = adjustPositionForAspectRatio(randomPos, img.width / img.height)
            console.log('[Canvas] Random position calculated:', position)
          } else {
            const aspectRatio = img.width / img.height
            position = adjustPositionForAspectRatio(position, aspectRatio)
            console.log('[Canvas] Using Claude position (adjusted for aspect ratio):', position)
          }
          
          const newElement = {
            id: `image-${Date.now()}-${Math.random()}`,
            type: 'image',
            url: assetUrl,
            image: img,
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
          }
          
          console.log('[Canvas] Adding element with position:', newElement.id, {
            x: newElement.x,
            y: newElement.y,
            width: newElement.width,
            height: newElement.height
          })
          setElements(prev => {
            const updated = [...prev, newElement]
            console.log('[Canvas] Total elements now:', updated.length)
            return updated
          })
          
          setSelectedElementId(newElement.id)
        } catch (error) {
          console.error('[Canvas] Failed to position asset, using fallback:', error)
          const aspectRatio = img.width / img.height
          const fallbackPos = getRandomPosition(canvasElements, stageSize.width, stageSize.height, imageCount)
          const adjustedPos = adjustPositionForAspectRatio(fallbackPos, aspectRatio)
          
          const newElement = {
            id: `image-${Date.now()}-${Math.random()}`,
            type: 'image',
            url: assetUrl,
            image: img,
            x: adjustedPos.x,
            y: adjustedPos.y,
            width: adjustedPos.width,
            height: adjustedPos.height,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
          }
          
          setElements(prev => [...prev, newElement])
          setSelectedElementId(newElement.id)
        }
        
        setTimeout(() => {
          lastAssetUrlRef.current = null
          if (onAssetAdded) {
            onAssetAdded()
          }
        }, 1000)
      }
      
      img.onerror = (e) => {
        console.error('[Canvas] Failed to load image:', assetUrl, e)
        lastAssetUrlRef.current = null
        if (onAssetAdded) {
          onAssetAdded()
        }
      }
    }
  }, [selectedAsset, onAssetAdded])

  useEffect(() => {
    if (selectedElementId && transformerRef.current) {
      const node = elementRefs.current[selectedElementId]
      if (node) {
        transformerRef.current.nodes([node])
        transformerRef.current.getLayer().batchDraw()
      } else {
        transformerRef.current.nodes([])
      }
    } else {
      if (transformerRef.current) {
        transformerRef.current.nodes([])
      }
    }
  }, [selectedElementId, elements])

  useEffect(() => {
    if (!containerRef.current) return

    const calculateScale = () => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const containerWidth = rect.width - 32
      const containerHeight = rect.height - 32

      const contentWidth = 1080
      const contentHeight = 1920

      const widthScale = containerWidth / contentWidth
      const heightScale = containerHeight / contentHeight
      const newScale = Math.min(widthScale, heightScale, 1)

      setScale(newScale)
      setStageSize({
        width: contentWidth * newScale,
        height: contentHeight * newScale
      })
    }

    calculateScale()
    const resizeObserver = new ResizeObserver(calculateScale)
    resizeObserver.observe(containerRef.current)

    window.addEventListener('resize', calculateScale)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', calculateScale)
    }
  }, [])

  useEffect(() => {
    if (onCanvasStateChange) {
      onCanvasStateChange({
        image_base64: imageBase64,
        elements: elements
      })
    }
  }, [elements, imageBase64, onCanvasStateChange])

  const finishDrawing = useCallback(() => {
    if (isDrawing && activeTool === 'draw' && drawingPoints.length >= 4) {
      const newElement = {
        id: `drawing-${Date.now()}`,
        type: 'drawing',
        points: drawingPoints,
        stroke: '#64748b',
        strokeWidth: 3,
        lineCap: 'round',
        lineJoin: 'round',
        tension: 0.5,
        x: 0,
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1
      }
      setElements(prev => [...prev, newElement])
      setSelectedElementId(newElement.id)
      setIsDrawing(false)
      setDrawingPoints([])
      setActiveTool(null)
      return true
    }
    return false
  }, [isDrawing, activeTool, drawingPoints])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (isDrawing && activeTool === 'draw' && drawingPoints.length >= 4) {
          e.preventDefault()
          finishDrawing()
        } else if (selectedElementId && !isDrawing && !activeTool) {
          e.preventDefault()
          setSelectedElementId(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDrawing, activeTool, drawingPoints, finishDrawing, selectedElementId])

  const handleElementClick = (e, elementId) => {
    e.cancelBubble = true
    if (e.evt) {
      e.evt.stopPropagation()
    }
    setActiveTool(null)
    setSelectedElementId(elementId)
  }

  const handleElementClickDirect = (e, elementId) => {
    if (e && e.evt) {
      e.evt.stopPropagation()
      e.evt.preventDefault()
    }
    setActiveTool(null)
    setSelectedElementId(elementId)
  }

  const handleRightClickMove = (e, elementId) => {
    if (e && e.evt) {
      e.evt.preventDefault()
      e.evt.stopPropagation()
    }
    setActiveTool(null)
    setSelectedElementId(elementId)
    const node = elementRefs.current[elementId]
    if (node) {
      node.startDrag()
    }
  }

  const handleStageClick = (e) => {
    const stage = e.target.getStage()
    const target = e.target
    const className = target.getClassName ? target.getClassName() : ''
    const isImage = className === 'Image'
    const isTransformer = className === 'Transformer'
    const isRect = className === 'Rect'
    const isCircle = className === 'Circle'
    const isLine = className === 'Line'
    const isText = className === 'Text'
    const isGroup = className === 'Group'
    
    if (isImage || isTransformer || isRect || isCircle || isLine || isText || isGroup) {
      return
    }
    
    if (target === stage || (target.getParent && target.getParent() === stage.getLayers()[0])) {
      console.log('[Canvas] Stage clicked (empty), deselecting')
      setSelectedElementId(null)
      setActiveTool(null)
    }
  }

  const handleStageMouseDown = (e) => {
    const stage = e.target.getStage()
    const target = e.target
    const className = target.getClassName ? target.getClassName() : ''
    
    if (className === 'Transformer') {
      return
    }
    
    if (className === 'Image' || className === 'Rect' || className === 'Circle' || className === 'Line' || className === 'Text' || className === 'Group') {
      if (activeTool && activeTool !== 'select') {
        return
      }
      setActiveTool(null)
      return
    }
    
    const clickedOnEmpty = target === stage || (target.getParent && target.getParent() === stage.getLayers()[0])
    
    if (!clickedOnEmpty && activeTool) {
      return
    }

    if (activeTool === 'draw') {
      setIsDrawing(true)
      const point = stage.getPointerPosition()
      if (point) {
        setDrawingPoints([point.x / scale, point.y / scale])
      }
    } else if (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line' || activeTool === 'arrow') {
      const point = stage.getPointerPosition()
      if (point) {
        setCurrentShape({
          type: activeTool,
          startX: point.x / scale,
          startY: point.y / scale,
          endX: point.x / scale,
          endY: point.y / scale
        })
      }
    }
  }

  const handleStageMouseMove = (e) => {
    const stage = e.target.getStage()
    if (!stage) return

    if (isDrawing && activeTool === 'draw') {
      const point = stage.getPointerPosition()
      if (point) {
        setDrawingPoints(prev => [...prev, point.x / scale, point.y / scale])
      }
    } else if (currentShape && (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line' || activeTool === 'arrow')) {
      const point = stage.getPointerPosition()
      if (point) {
        setCurrentShape({
          ...currentShape,
          endX: point.x / scale,
          endY: point.y / scale
        })
      }
    }
  }

  const handleStageMouseUp = (e) => {
    const stage = e.target.getStage()
    if (!stage) return

    if (isDrawing && activeTool === 'draw') {
      finishDrawing()
    } else if (currentShape && (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line' || activeTool === 'arrow')) {
      const { startX, startY, endX, endY, type } = currentShape
      const width = Math.abs(endX - startX)
      const height = Math.abs(endY - startY)
      const x = Math.min(startX, endX)
      const y = Math.min(startY, endY)

      if (width > 5 || height > 5) {
        let newElement
        if (type === 'rectangle') {
          newElement = {
            id: `rect-${Date.now()}`,
            type: 'rectangle',
            x,
            y,
            width,
            height,
            fill: 'transparent',
            stroke: '#64748b',
            strokeWidth: 3,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
          }
        } else if (type === 'circle') {
          const radius = Math.max(width, height) / 2
          newElement = {
            id: `circle-${Date.now()}`,
            type: 'circle',
            x: startX + (endX - startX) / 2,
            y: startY + (endY - startY) / 2,
            radius,
            fill: 'transparent',
            stroke: '#64748b',
            strokeWidth: 3,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
          }
        } else if (type === 'line') {
          newElement = {
            id: `line-${Date.now()}`,
            type: 'line',
            points: [startX, startY, endX, endY],
            stroke: '#64748b',
            strokeWidth: 3,
            lineCap: 'round',
            rotation: 0,
            scaleX: 1,
            scaleY: 1
          }
        } else if (type === 'arrow') {
          newElement = {
            id: `arrow-${Date.now()}`,
            type: 'arrow',
            points: [startX, startY, endX, endY],
            stroke: '#64748b',
            strokeWidth: 3,
            fill: '#64748b',
            pointerLength: 10,
            pointerWidth: 10,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
          }
        }
        
        if (newElement) {
          setElements(prev => [...prev, newElement])
          setSelectedElementId(newElement.id)
        }
      }
      setCurrentShape(null)
    }
  }

  const updateElement = (id, updates) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ))
  }

  const handleAddText = (text, color) => {
    const newElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: text,
      x: 540,
      y: 960,
      fontSize: 48,
      fill: color,
      fontFamily: 'Inter, sans-serif',
      rotation: 0,
      scaleX: 1,
      scaleY: 1
    }
    setElements(prev => [...prev, newElement])
    setSelectedElementId(newElement.id)
  }

  const handleRotate = () => {
    if (selectedElementId) {
      const element = elements.find(el => el.id === selectedElementId)
      if (element) {
        updateElement(selectedElementId, { rotation: (element.rotation || 0) + 90 })
      }
    }
  }

  const handleColorChange = (color) => {
    if (selectedElementId) {
      const element = elements.find(el => el.id === selectedElementId)
      if (element) {
        if (element.type === 'text' || element.type === 'circle' || element.type === 'rectangle' || element.type === 'arrow') {
          updateElement(selectedElementId, { fill: color })
        }
        if (element.type === 'drawing' || element.type === 'line' || element.type === 'arrow') {
          updateElement(selectedElementId, { stroke: color })
        }
      }
    }
  }

  const handleFlipHorizontal = () => {
    if (selectedElementId) {
      const element = elements.find(el => el.id === selectedElementId)
      if (element) {
        updateElement(selectedElementId, { scaleX: (element.scaleX || 1) * -1 })
      }
    }
  }

  const handleFlipVertical = () => {
    if (selectedElementId) {
      const element = elements.find(el => el.id === selectedElementId)
      if (element) {
        updateElement(selectedElementId, { scaleY: (element.scaleY || 1) * -1 })
      }
    }
  }

  const handleRemoveBackground = async () => {
    if (selectedElementId) {
      const element = elements.find(el => el.id === selectedElementId)
      if (element && element.type === 'image') {
        try {
          console.log('[Canvas] Removing background from image:', element.id)
          
          let imageBase64 = null
          
          if (element.url) {
            const response = await fetch(element.url)
            const blob = await response.blob()
            const reader = new FileReader()
            reader.onloadend = async () => {
              const base64 = reader.result.split(',')[1]
              try {
                const bgResponse = await removeBackground(base64)
                if (bgResponse.success && bgResponse.image_base64) {
                  const img = new window.Image()
                  img.crossOrigin = 'anonymous'
                  img.onload = () => {
                    updateElement(element.id, {
                      image: img,
                      url: element.url
                    })
                    console.log('[Canvas] Background removed successfully')
                  }
                  img.src = `data:image/png;base64,${bgResponse.image_base64}`
                }
              } catch (error) {
                console.error('[Canvas] Background removal failed:', error)
                alert('Failed to remove background: ' + error.message)
              }
            }
            reader.readAsDataURL(blob)
            return
          } else if (element.image) {
            const img = element.image
            const canvas = document.createElement('canvas')
            canvas.width = img.width || img.naturalWidth || 500
            canvas.height = img.height || img.naturalHeight || 500
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0)
            imageBase64 = canvas.toDataURL('image/png').split(',')[1]
          }
          
          if (!imageBase64) {
            alert('Could not extract image data for background removal')
            return
          }
          
          const response = await removeBackground(imageBase64)
          
          if (response.success && response.image_base64) {
            const img = new window.Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => {
              updateElement(element.id, {
                image: img
              })
              console.log('[Canvas] Background removed successfully')
            }
            img.src = `data:image/png;base64,${response.image_base64}`
          }
        } catch (error) {
          console.error('[Canvas] Background removal failed:', error)
          alert('Failed to remove background: ' + error.message)
        }
      }
    }
  }

  const handleDelete = () => {
    if (selectedElementId) {
      setElements(prev => prev.filter(el => el.id !== selectedElementId))
      setSelectedElementId(null)
    }
  }

  const handleBringToFront = () => {
    if (selectedElementId) {
      setElements(prev => {
        const element = prev.find(el => el.id === selectedElementId)
        if (element) {
          return [...prev.filter(el => el.id !== selectedElementId), element]
        }
        return prev
      })
    }
  }

  const handleSendToBack = () => {
    if (selectedElementId) {
      setElements(prev => {
        const element = prev.find(el => el.id === selectedElementId)
        if (element) {
          return [element, ...prev.filter(el => el.id !== selectedElementId)]
        }
        return prev
      })
    }
  }

  const handleDownload = () => {
    if (!stageRef.current) return

    const stage = stageRef.current
    const dataURL = stage.toDataURL({ 
      pixelRatio: 2,
      mimeType: 'image/png',
      quality: 0.95
    })

    const link = document.createElement('a')
    link.download = `creative-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }

  const selectedElement = elements.find(el => el.id === selectedElementId)

  const safeZoneTop = 200
  const safeZoneBottom = 250
  const scaledTop = safeZoneTop * scale
  const scaledBottom = safeZoneBottom * scale

  const handleUpdateElement = (updates) => {
    if (selectedElementId) {
      updateElement(selectedElementId, updates)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-slate-200/40 bg-white/70 backdrop-blur-2xl">
        <div className="p-5 border-b border-slate-200/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800 mb-1 tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>Canvas</h2>
              <p className="text-xs text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>1080 × 1920px</p>
            </div>
            <div className="text-xs text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              {elements.length} {elements.length === 1 ? 'element' : 'elements'}
            </div>
          </div>
        </div>
        <EditToolbar
          onAddText={handleAddText}
          onRotate={handleRotate}
          onColorChange={handleColorChange}
          onRemoveBackground={handleRemoveBackground}
          onDownload={handleDownload}
          selectedElement={selectedElement}
          onFlipHorizontal={handleFlipHorizontal}
          onFlipVertical={handleFlipVertical}
          onDelete={handleDelete}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          activeTool={activeTool}
          onToolChange={setActiveTool}
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center p-8 overflow-hidden bg-slate-50/50 relative rounded-2xl"
        >

        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          className="border border-slate-300/40 rounded-xl shadow-lg"
          onClick={handleStageClick}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={stageSize.width}
              height={stageSize.height}
              fill={canvasBackgroundColor}
              listening={false}
            />
            {backgroundImage ? (
              <KonvaImage
                image={backgroundImage}
                x={0}
                y={0}
                width={stageSize.width}
                height={stageSize.height}
                listening={false}
              />
            ) : null}
          </Layer>

          <Layer>
            {elements.map((element) => {
              if (element.type === 'image' && element.image) {
                console.log('[Canvas] Rendering image:', element.id, 'at', element.x, element.y)
                return (
                  <Group
                    key={element.id}
                    ref={(node) => {
                      if (node) {
                        elementRefs.current[element.id] = node
                        console.log('[Canvas] Image ref set:', element.id)
                      }
                    }}
                    x={element.x * scale}
                    y={element.y * scale}
                    rotation={element.rotation || 0}
                    scaleX={element.scaleX || 1}
                    scaleY={element.scaleY || 1}
                    draggable={true}
                    listening={true}
                    hitFunc={(ctx, shape) => {
                      const width = element.width * scale
                      const height = element.height * scale
                      ctx.beginPath()
                      ctx.rect(0, 0, width, height)
                      ctx.fillStyle = 'black'
                      ctx.fill()
                    }}
                    onMouseDown={(e) => {
                      if (e.evt && e.evt.shiftKey) {
                        handleRightClickMove(e, element.id)
                      } else if (e.evt && e.evt.button === 2) {
                        handleRightClickMove(e, element.id)
                      } else {
                        handleElementClickDirect(e, element.id)
                      }
                    }}
                    onClick={(e) => handleElementClickDirect(e, element.id)}
                    onTap={(e) => handleElementClickDirect(e, element.id)}
                    onContextMenu={(e) => {
                      e.evt.preventDefault()
                      handleRightClickMove(e, element.id)
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onDragStart={(e) => {
                      setActiveTool(null)
                    }}
                    onDragMove={(e) => {
                      const node = e.target
                      const newX = node.x() / scale
                      const newY = node.y() / scale
                      updateElement(element.id, {
                        x: newX,
                        y: newY
                      })
                    }}
                    onDragEnd={(e) => {
                      const node = e.target
                      const newX = node.x() / scale
                      const newY = node.y() / scale
                      updateElement(element.id, {
                        x: newX,
                        y: newY
                      })
                    }}
                    onTransformEnd={() => {
                      const node = elementRefs.current[element.id]
                      if (node) {
                        const scaleX = node.scaleX()
                        const scaleY = node.scaleY()
                        node.scaleX(1)
                        node.scaleY(1)
                        updateElement(element.id, {
                          x: node.x() / scale,
                          y: node.y() / scale,
                          width: Math.max(50, element.width * scaleX),
                          height: Math.max(50, element.height * scaleY),
                          rotation: node.rotation(),
                          scaleX: scaleX,
                          scaleY: scaleY
                        })
                      }
                    }}
                  >
                    <KonvaImage
                      image={element.image}
                      x={0}
                      y={0}
                      width={element.width * scale}
                      height={element.height * scale}
                      perfectDrawEnabled={false}
                      listening={true}
                      draggable={false}
                      hitFunc={(ctx, shape) => {
                        const width = element.width * scale
                        const height = element.height * scale
                        ctx.beginPath()
                        ctx.rect(0, 0, width, height)
                        ctx.fillStyle = 'black'
                        ctx.fill()
                      }}
                    />
                    <Group
                      x={element.width * scale - 24}
                      y={4}
                      listening={false}
                    >
                      <Rect
                        x={0}
                        y={0}
                        width={20}
                        height={20}
                        fill="white"
                        opacity={0.9}
                        cornerRadius={4}
                        shadowBlur={4}
                        shadowColor="black"
                        shadowOpacity={0.3}
                      />
                      <Shape
                        sceneFunc={(ctx, shape) => {
                          ctx.beginPath()
                          ctx.moveTo(10, 4)
                          ctx.lineTo(10, 16)
                          ctx.moveTo(4, 10)
                          ctx.lineTo(16, 10)
                          ctx.moveTo(6, 6)
                          ctx.lineTo(14, 14)
                          ctx.moveTo(14, 6)
                          ctx.lineTo(6, 14)
                          ctx.strokeStyle = '#64748b'
                          ctx.lineWidth = 2
                          ctx.stroke()
                          ctx.beginPath()
                          ctx.arc(10, 10, 2, 0, Math.PI * 2)
                          ctx.fillStyle = '#64748b'
                          ctx.fill()
                        }}
                        fill="#64748b"
                        stroke="#64748b"
                        strokeWidth={2}
                      />
                    </Group>
                  </Group>
                )
              } else if (element.type === 'text') {
                return (
                  <KonvaText
                    key={element.id}
                    ref={(node) => {
                      if (node) elementRefs.current[element.id] = node
                    }}
                    text={element.text}
                    x={element.x * scale}
                    y={element.y * scale}
                    fontSize={(element.fontSize || 48) * scale}
                    fill={element.fill || '#64748b'}
                    fontFamily={element.fontFamily || 'Inter, sans-serif'}
                    rotation={element.rotation || 0}
                    scaleX={element.scaleX || 1}
                    scaleY={element.scaleY || 1}
                    draggable
                    listening={true}
                    hitFunc={(ctx, shape) => {
                      const text = element.text || ''
                      const fontSize = (element.fontSize || 48) * scale
                      const width = ctx.measureText(text).width || fontSize * text.length * 0.6
                      const height = fontSize * 1.2
                      ctx.beginPath()
                      ctx.rect(0, 0, width, height)
                      ctx.fillStyle = 'transparent'
                      ctx.fill()
                    }}
                    onMouseDown={(e) => {
                      if (e.evt && e.evt.shiftKey) {
                        handleRightClickMove(e, element.id)
                      } else if (e.evt && e.evt.button === 2) {
                        handleRightClickMove(e, element.id)
                      } else {
                        handleElementClickDirect(e, element.id)
                      }
                    }}
                    onClick={(e) => handleElementClickDirect(e, element.id)}
                    onTap={(e) => handleElementClickDirect(e, element.id)}
                    onContextMenu={(e) => {
                      e.evt.preventDefault()
                      handleRightClickMove(e, element.id)
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onDragEnd={(e) => {
                      updateElement(element.id, {
                        x: e.target.x() / scale,
                        y: e.target.y() / scale
                      })
                    }}
                    onTransformEnd={() => {
                      const node = elementRefs.current[element.id]
                      if (node) {
                        const scaleX = node.scaleX()
                        const scaleY = node.scaleY()
                        node.scaleX(1)
                        node.scaleY(1)
                        updateElement(element.id, {
                          x: node.x() / scale,
                          y: node.y() / scale,
                          fontSize: Math.max(12, node.fontSize() * scaleX / scale),
                          rotation: node.rotation(),
                          scaleX: scaleX,
                          scaleY: scaleY
                        })
                      }
                    }}
                  />
                )
              } else if (element.type === 'drawing') {
                const minX = Math.min(...element.points.filter((_, i) => i % 2 === 0)) * scale
                const minY = Math.min(...element.points.filter((_, i) => i % 2 === 1)) * scale
                const maxX = Math.max(...element.points.filter((_, i) => i % 2 === 0)) * scale
                const maxY = Math.max(...element.points.filter((_, i) => i % 2 === 1)) * scale
                const width = maxX - minX
                const height = maxY - minY
                
                return (
                  <Group
                    key={element.id}
                    ref={(node) => {
                      if (node) elementRefs.current[element.id] = node
                    }}
                    x={(element.x || minX / scale) * scale}
                    y={(element.y || minY / scale) * scale}
                    rotation={element.rotation || 0}
                    scaleX={element.scaleX || 1}
                    scaleY={element.scaleY || 1}
                    draggable={true}
                    listening={true}
                    hitFunc={(ctx, shape) => {
                      ctx.beginPath()
                      ctx.rect(0, 0, Math.max(width, 50), Math.max(height, 50))
                      ctx.fillStyle = 'black'
                      ctx.fill()
                    }}
                    onMouseDown={(e) => {
                      if (e.evt && e.evt.shiftKey) {
                        handleRightClickMove(e, element.id)
                      } else if (e.evt && e.evt.button === 2) {
                        handleRightClickMove(e, element.id)
                      } else {
                        handleElementClickDirect(e, element.id)
                      }
                    }}
                    onClick={(e) => handleElementClickDirect(e, element.id)}
                    onTap={(e) => handleElementClickDirect(e, element.id)}
                    onContextMenu={(e) => {
                      e.evt.preventDefault()
                      handleRightClickMove(e, element.id)
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onDragStart={(e) => {
                      setActiveTool(null)
                    }}
                    onDragMove={(e) => {
                      const node = e.target
                      const newX = node.x() / scale
                      const newY = node.y() / scale
                      updateElement(element.id, {
                        x: newX,
                        y: newY
                      })
                    }}
                    onDragEnd={(e) => {
                      const node = e.target
                      const newX = node.x() / scale
                      const newY = node.y() / scale
                      updateElement(element.id, {
                        x: newX,
                        y: newY
                      })
                    }}
                    onTransformEnd={() => {
                      const node = elementRefs.current[element.id]
                      if (node) {
                        const scaleX = node.scaleX()
                        const scaleY = node.scaleY()
                        node.scaleX(1)
                        node.scaleY(1)
                        const newPoints = element.points.map((p, i) => {
                          if (i % 2 === 0) return p * scaleX
                          return p * scaleY
                        })
                        updateElement(element.id, {
                          points: newPoints,
                          x: node.x() / scale,
                          y: node.y() / scale,
                          rotation: node.rotation(),
                          scaleX: scaleX,
                          scaleY: scaleY
                        })
                      }
                    }}
                  >
                    <Line
                      points={element.points.map((p, i) => {
                        const baseX = element.x || minX / scale
                        const baseY = element.y || minY / scale
                        if (i % 2 === 0) return (p - baseX) * scale
                        return (p - baseY) * scale
                      })}
                      stroke={element.stroke || '#64748b'}
                      strokeWidth={(element.strokeWidth || 3) * scale}
                      lineCap={element.lineCap || 'round'}
                      lineJoin={element.lineJoin || 'round'}
                      tension={element.tension || 0.5}
                      listening={false}
                    />
                  </Group>
                )
              } else if (element.type === 'rectangle') {
                return (
                  <Rect
                    key={element.id}
                    ref={(node) => {
                      if (node) elementRefs.current[element.id] = node
                    }}
                    x={element.x * scale}
                    y={element.y * scale}
                    width={element.width * scale}
                    height={element.height * scale}
                    fill={element.fill || 'transparent'}
                    stroke={element.stroke || '#64748b'}
                    strokeWidth={(element.strokeWidth || 3) * scale}
                    rotation={element.rotation || 0}
                    scaleX={element.scaleX || 1}
                    scaleY={element.scaleY || 1}
                    draggable
                    listening={true}
                    hitFunc={(ctx, shape) => {
                      ctx.beginPath()
                      ctx.rect(0, 0, element.width * scale, element.height * scale)
                      ctx.fillStrokeShape(shape)
                    }}
                    onMouseDown={(e) => {
                      if (e.evt && e.evt.shiftKey) {
                        handleRightClickMove(e, element.id)
                      } else if (e.evt && e.evt.button === 2) {
                        handleRightClickMove(e, element.id)
                      } else {
                        handleElementClickDirect(e, element.id)
                      }
                    }}
                    onClick={(e) => handleElementClickDirect(e, element.id)}
                    onTap={(e) => handleElementClickDirect(e, element.id)}
                    onContextMenu={(e) => {
                      e.evt.preventDefault()
                      handleRightClickMove(e, element.id)
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onDragEnd={(e) => {
                      updateElement(element.id, {
                        x: e.target.x() / scale,
                        y: e.target.y() / scale
                      })
                    }}
                    onTransformEnd={() => {
                      const node = elementRefs.current[element.id]
                      if (node) {
                        const scaleX = node.scaleX()
                        const scaleY = node.scaleY()
                        node.scaleX(1)
                        node.scaleY(1)
                        updateElement(element.id, {
                          x: node.x() / scale,
                          y: node.y() / scale,
                          width: Math.max(20, node.width() * scaleX / scale),
                          height: Math.max(20, node.height() * scaleY / scale),
                          rotation: node.rotation(),
                          scaleX: scaleX,
                          scaleY: scaleY
                        })
                      }
                    }}
                  />
                )
              } else if (element.type === 'circle') {
                return (
                  <Circle
                    key={element.id}
                    ref={(node) => {
                      if (node) elementRefs.current[element.id] = node
                    }}
                    x={element.x * scale}
                    y={element.y * scale}
                    radius={element.radius * scale}
                    fill={element.fill || 'transparent'}
                    stroke={element.stroke || '#64748b'}
                    strokeWidth={(element.strokeWidth || 3) * scale}
                    rotation={element.rotation || 0}
                    scaleX={element.scaleX || 1}
                    scaleY={element.scaleY || 1}
                    draggable
                    listening={true}
                    hitFunc={(ctx, shape) => {
                      ctx.beginPath()
                      ctx.arc(0, 0, element.radius * scale, 0, Math.PI * 2)
                      ctx.fillStrokeShape(shape)
                    }}
                    onClick={(e) => handleElementClickDirect(e, element.id)}
                    onTap={(e) => handleElementClickDirect(e, element.id)}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onDragEnd={(e) => {
                      updateElement(element.id, {
                        x: e.target.x() / scale,
                        y: e.target.y() / scale
                      })
                    }}
                    onTransformEnd={() => {
                      const node = elementRefs.current[element.id]
                      if (node) {
                        const scaleX = node.scaleX()
                        const scaleY = node.scaleY()
                        node.scaleX(1)
                        node.scaleY(1)
                        updateElement(element.id, {
                          x: node.x() / scale,
                          y: node.y() / scale,
                          radius: Math.max(10, node.radius() * Math.max(scaleX, scaleY) / scale),
                          rotation: node.rotation(),
                          scaleX: scaleX,
                          scaleY: scaleY
                        })
                      }
                    }}
                  />
                )
              } else if (element.type === 'line') {
                return (
                  <Line
                    key={element.id}
                    ref={(node) => {
                      if (node) elementRefs.current[element.id] = node
                    }}
                    points={element.points.map(p => p * scale)}
                    stroke={element.stroke || '#64748b'}
                    strokeWidth={(element.strokeWidth || 3) * scale}
                    lineCap={element.lineCap || 'round'}
                    rotation={element.rotation || 0}
                    scaleX={element.scaleX || 1}
                    scaleY={element.scaleY || 1}
                    draggable
                    listening={true}
                    hitFunc={(ctx, shape) => {
                      const strokeWidth = (element.strokeWidth || 3) * scale
                      const expandedWidth = Math.max(strokeWidth, 10)
                      ctx.beginPath()
                      const points = element.points
                      if (points.length >= 4) {
                        ctx.moveTo(points[0] * scale, points[1] * scale)
                        ctx.lineTo(points[2] * scale, points[3] * scale)
                      }
                      ctx.lineWidth = expandedWidth
                      ctx.lineCap = 'round'
                      ctx.strokeStyle = element.stroke || '#64748b'
                      ctx.stroke()
                    }}
                    onMouseDown={(e) => {
                      if (e.evt && e.evt.shiftKey) {
                        handleRightClickMove(e, element.id)
                      } else if (e.evt && e.evt.button === 2) {
                        handleRightClickMove(e, element.id)
                      } else {
                        handleElementClickDirect(e, element.id)
                      }
                    }}
                    onClick={(e) => handleElementClickDirect(e, element.id)}
                    onTap={(e) => handleElementClickDirect(e, element.id)}
                    onContextMenu={(e) => {
                      e.evt.preventDefault()
                      handleRightClickMove(e, element.id)
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onDragEnd={(e) => {
                      const node = elementRefs.current[element.id]
                      if (node) {
                        const offsetX = (node.x() - element.x * scale) / scale
                        const offsetY = (node.y() - element.y * scale) / scale
                        const newPoints = element.points.map((p, i) => {
                          if (i % 2 === 0) return p + offsetX
                          return p + offsetY
                        })
                        updateElement(element.id, {
                          points: newPoints,
                          x: node.x() / scale,
                          y: node.y() / scale
                        })
                        node.x(0)
                        node.y(0)
                      }
                    }}
                    onTransformEnd={() => {
                      const node = elementRefs.current[element.id]
                      if (node) {
                        const scaleX = node.scaleX()
                        const scaleY = node.scaleY()
                        node.scaleX(1)
                        node.scaleY(1)
                        updateElement(element.id, {
                          points: element.points.map((p, i) => {
                            if (i % 2 === 0) return p * scaleX
                            return p * scaleY
                          }),
                          rotation: node.rotation(),
                          scaleX: scaleX,
                          scaleY: scaleY
                        })
                      }
                    }}
                  />
                )
              } else if (element.type === 'arrow') {
                const [x1, y1, x2, y2] = element.points
                const scaledPoints = [x1 * scale, y1 * scale, x2 * scale, y2 * scale]
                const pointerLength = (element.pointerLength || 10) * scale
                const pointerWidth = (element.pointerWidth || 10) * scale
                const angle = Math.atan2(y2 - y1, x2 - x1)
                const arrowHeadX = scaledPoints[2]
                const arrowHeadY = scaledPoints[3]
                const arrowPoints = [
                  arrowHeadX,
                  arrowHeadY,
                  arrowHeadX - pointerLength * Math.cos(angle - Math.PI / 6),
                  arrowHeadY - pointerLength * Math.sin(angle - Math.PI / 6),
                  arrowHeadX - pointerLength * Math.cos(angle + Math.PI / 6),
                  arrowHeadY - pointerLength * Math.sin(angle + Math.PI / 6)
                ]

                return (
                  <Group
                    key={element.id}
                    ref={(node) => {
                      if (node) elementRefs.current[element.id] = node
                    }}
                    x={element.x * scale}
                    y={element.y * scale}
                    rotation={element.rotation || 0}
                    scaleX={element.scaleX || 1}
                    scaleY={element.scaleY || 1}
                    draggable
                    listening={true}
                    hitFunc={(ctx, shape) => {
                      const width = Math.abs(element.points[2] - element.points[0]) * scale
                      const height = Math.abs(element.points[3] - element.points[1]) * scale
                      ctx.beginPath()
                      ctx.rect(0, 0, Math.max(width, 50), Math.max(height, 50))
                      ctx.fillStyle = 'transparent'
                      ctx.fill()
                    }}
                    onMouseDown={(e) => {
                      if (e.evt && e.evt.shiftKey) {
                        handleRightClickMove(e, element.id)
                      } else if (e.evt && e.evt.button === 2) {
                        handleRightClickMove(e, element.id)
                      } else {
                        handleElementClickDirect(e, element.id)
                      }
                    }}
                    onClick={(e) => handleElementClickDirect(e, element.id)}
                    onTap={(e) => handleElementClickDirect(e, element.id)}
                    onContextMenu={(e) => {
                      e.evt.preventDefault()
                      handleRightClickMove(e, element.id)
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onDragEnd={(e) => {
                      const node = elementRefs.current[element.id]
                      if (node) {
                        const offsetX = (node.x() - element.x * scale) / scale
                        const offsetY = (node.y() - element.y * scale) / scale
                        const newPoints = element.points.map((p, i) => {
                          if (i % 2 === 0) return p + offsetX
                          return p + offsetY
                        })
                        updateElement(element.id, {
                          points: newPoints,
                          x: node.x() / scale,
                          y: node.y() / scale
                        })
                        node.x(0)
                        node.y(0)
                      }
                    }}
                    onTransformEnd={() => {
                      const node = elementRefs.current[element.id]
                      if (node) {
                        const scaleX = node.scaleX()
                        const scaleY = node.scaleY()
                        node.scaleX(1)
                        node.scaleY(1)
                        updateElement(element.id, {
                          points: element.points.map((p, i) => {
                            if (i % 2 === 0) return p * scaleX
                            return p * scaleY
                          }),
                          rotation: node.rotation(),
                          scaleX: scaleX,
                          scaleY: scaleY
                        })
                      }
                    }}
                  >
                    <Line
                      points={scaledPoints.slice(0, 4)}
                      stroke={element.stroke || '#64748b'}
                      strokeWidth={(element.strokeWidth || 3) * scale}
                      lineCap="round"
                    />
                    <Shape
                      sceneFunc={(context, shape) => {
                        context.beginPath()
                        context.moveTo(arrowPoints[0], arrowPoints[1])
                        context.lineTo(arrowPoints[2], arrowPoints[3])
                        context.lineTo(arrowPoints[4], arrowPoints[5])
                        context.closePath()
                        context.fillStyle = element.fill || element.stroke || '#64748b'
                        context.fill()
                        context.strokeStyle = element.stroke || '#64748b'
                        context.lineWidth = (element.strokeWidth || 3) * scale
                        context.stroke()
                      }}
                    />
                  </Group>
                )
              }
              return null
            })}

            {isDrawing && drawingPoints.length > 0 && (
              <Line
                points={drawingPoints.map(p => p * scale)}
                stroke="#64748b"
                strokeWidth={3 * scale}
                lineCap="round"
                lineJoin="round"
                tension={0.5}
              />
            )}

            {currentShape && (
              <>
                {currentShape.type === 'rectangle' && (
                  <Rect
                    x={Math.min(currentShape.startX, currentShape.endX) * scale}
                    y={Math.min(currentShape.startY, currentShape.endY) * scale}
                    width={Math.abs(currentShape.endX - currentShape.startX) * scale}
                    height={Math.abs(currentShape.endY - currentShape.startY) * scale}
                    fill="transparent"
                    stroke="#64748b"
                    strokeWidth={3 * scale}
                    dash={[5, 5]}
                  />
                )}
                {currentShape.type === 'circle' && (
                  <Circle
                    x={(currentShape.startX + (currentShape.endX - currentShape.startX) / 2) * scale}
                    y={(currentShape.startY + (currentShape.endY - currentShape.startY) / 2) * scale}
                    radius={Math.max(Math.abs(currentShape.endX - currentShape.startX), Math.abs(currentShape.endY - currentShape.startY)) * scale / 2}
                    fill="transparent"
                    stroke="#64748b"
                    strokeWidth={3 * scale}
                    dash={[5, 5]}
                  />
                )}
                {currentShape.type === 'line' && (
                  <Line
                    points={[currentShape.startX * scale, currentShape.startY * scale, currentShape.endX * scale, currentShape.endY * scale]}
                    stroke="#64748b"
                    strokeWidth={3 * scale}
                    lineCap="round"
                    dash={[5, 5]}
                  />
                )}
                {currentShape.type === 'arrow' && (() => {
                  const [x1, y1, x2, y2] = [currentShape.startX * scale, currentShape.startY * scale, currentShape.endX * scale, currentShape.endY * scale]
                  const angle = Math.atan2(y2 - y1, x2 - x1)
                  const pointerLength = 10 * scale
                  const arrowPoints = [
                    x2,
                    y2,
                    x2 - pointerLength * Math.cos(angle - Math.PI / 6),
                    y2 - pointerLength * Math.sin(angle - Math.PI / 6),
                    x2 - pointerLength * Math.cos(angle + Math.PI / 6),
                    y2 - pointerLength * Math.sin(angle + Math.PI / 6)
                  ]
                  return (
                    <Group>
                      <Line
                        points={[x1, y1, x2, y2]}
                        stroke="#64748b"
                        strokeWidth={3 * scale}
                        lineCap="round"
                        dash={[5, 5]}
                      />
                      <Shape
                        sceneFunc={(context, shape) => {
                          context.beginPath()
                          context.moveTo(arrowPoints[0], arrowPoints[1])
                          context.lineTo(arrowPoints[2], arrowPoints[3])
                          context.lineTo(arrowPoints[4], arrowPoints[5])
                          context.closePath()
                          context.fillStyle = '#64748b'
                          context.fill()
                          context.strokeStyle = '#64748b'
                          context.lineWidth = 3 * scale
                          context.stroke()
                        }}
                      />
                    </Group>
                  )
                })()}
              </>
            )}

            {selectedElementId && (
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
                    return oldBox
                  }
                  return newBox
                }}
                borderEnabled={true}
                borderStroke="#38e8ff"
                borderStrokeWidth={1}
                anchorFill="#38e8ff"
                anchorStroke="#64748b"
                anchorStrokeWidth={1}
                anchorSize={6}
                rotateEnabled={true}
              />
            )}
          </Layer>

          <Layer>
            {scaledTop > 0 && (
              <Group>
                <Line
                  points={[0, scaledTop, stageSize.width, scaledTop]}
                  stroke="#38e8ff"
                  strokeWidth={0.5}
                  dash={[4, 4]}
                  opacity={0.4}
                />
                <Line
                  points={[stageSize.width / 2, 0, stageSize.width / 2, scaledTop]}
                  stroke="#38e8ff"
                  strokeWidth={0.5}
                  dash={[4, 4]}
                  opacity={0.4}
                />
                <Line
                  points={[0, scaledTop / 2, stageSize.width, scaledTop / 2]}
                  stroke="#38e8ff"
                  strokeWidth={0.5}
                  dash={[4, 4]}
                  opacity={0.4}
                />
                <KonvaText
                  x={8}
                  y={scaledTop - 14}
                  text="SAFE ZONE: 200PX"
                  fontSize={9 * scale}
                  fill="#38e8ff"
                  fontFamily="IBM Plex Mono, monospace"
                  fontStyle="normal"
                  opacity={0.6}
                />
              </Group>
            )}
            {scaledBottom > 0 && (
              <Group>
                <Line
                  points={[0, stageSize.height - scaledBottom, stageSize.width, stageSize.height - scaledBottom]}
                  stroke="#38e8ff"
                  strokeWidth={0.5}
                  dash={[4, 4]}
                  opacity={0.4}
                />
                <Line
                  points={[stageSize.width / 2, stageSize.height - scaledBottom, stageSize.width / 2, stageSize.height]}
                  stroke="#38e8ff"
                  strokeWidth={0.5}
                  dash={[4, 4]}
                  opacity={0.4}
                />
                <Line
                  points={[0, stageSize.height - scaledBottom / 2, stageSize.width, stageSize.height - scaledBottom / 2]}
                  stroke="#38e8ff"
                  strokeWidth={0.5}
                  dash={[4, 4]}
                  opacity={0.4}
                />
                <KonvaText
                  x={8}
                  y={stageSize.height - scaledBottom + 6}
                  text="SAFE ZONE: 250PX"
                  fontSize={9 * scale}
                  fill="#38e8ff"
                  fontFamily="IBM Plex Mono, monospace"
                  fontStyle="normal"
                  opacity={0.6}
                />
              </Group>
            )}
          </Layer>
        </Stage>
        </div>

        <PropertiesPanel 
          selectedElement={selectedElement} 
          onUpdate={handleUpdateElement}
          canvasBackgroundColor={canvasBackgroundColor}
          onCanvasBackgroundChange={setCanvasBackgroundColor}
        />
      </div>
    </div>
  )
}
