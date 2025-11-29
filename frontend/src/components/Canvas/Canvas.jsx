import { Stage, Layer, Rect, Image as KonvaImage, Transformer, Group, Line, Text } from 'react-konva'
import useImage from 'use-image'
import { useState, useEffect, useRef } from 'react'

export default function Canvas({ aiLayout, onCanvasStateChange, selectedAsset }) {
  const [scale, setScale] = useState(1)
  const [stageSize, setStageSize] = useState({ width: 1080, height: 1920 })
  const containerRef = useRef(null)

  const [backgroundImage] = useImage(aiLayout?.background_url || null)
  const [productImage, setProductImage] = useState(null)
  const [productPosition, setProductPosition] = useState({ x: 540, y: 960, width: 400, height: 400 })
  const [isSelected, setIsSelected] = useState(false)
  
  const transformerRef = useRef(null)
  const productRef = useRef(null)

  useEffect(() => {
    if (selectedAsset && selectedAsset.url) {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.src = selectedAsset.url
      img.onload = () => {
        setProductImage(img)
        setIsSelected(true)
      }
    }
  }, [selectedAsset])

  useEffect(() => {
    if (isSelected && transformerRef.current && productRef.current) {
      transformerRef.current.nodes([productRef.current])
      transformerRef.current.getLayer().batchDraw()
    }
  }, [isSelected, productPosition])

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
        background_url: aiLayout?.background_url,
        product: productImage ? {
          url: selectedAsset?.url,
          x: productPosition.x,
          y: productPosition.y,
          width: productPosition.width,
          height: productPosition.height
        } : null
      })
    }
  }, [productPosition, productImage, aiLayout, selectedAsset, onCanvasStateChange])

  const safeZoneTop = 200
  const safeZoneBottom = 250
  const scaledTop = safeZoneTop * scale
  const scaledBottom = safeZoneBottom * scale

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-slate-300 bg-white rounded-t-md">
        <h2 className="text-base font-bold text-[#003349] uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>DIGITAL EASEL</h2>
        <p className="text-xs text-[#2d373c] mt-0.5" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>1080 × 1920px</p>
      </div>

      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-slate-100 rounded-b-md"
      >
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          className="border border-slate-400 rounded-md"
          onMouseDown={(e) => {
            const clickedOnEmpty = e.target === e.target.getStage()
            if (clickedOnEmpty && transformerRef.current) {
              transformerRef.current.nodes([])
              setIsSelected(false)
            }
          }}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={stageSize.width}
              height={stageSize.height}
              fill="#000000"
            />
            {backgroundImage && (
              <KonvaImage
                image={backgroundImage}
                x={0}
                y={0}
                width={stageSize.width}
                height={stageSize.height}
              />
            )}
          </Layer>

          <Layer>
            {productImage && (
              <>
                <KonvaImage
                  ref={productRef}
                  image={productImage}
                  x={productPosition.x * scale}
                  y={productPosition.y * scale}
                  width={productPosition.width * scale}
                  height={productPosition.height * scale}
                  draggable
                  onClick={() => setIsSelected(true)}
                  onDragEnd={(e) => {
                    setProductPosition({
                      ...productPosition,
                      x: e.target.x() / scale,
                      y: e.target.y() / scale
                    })
                  }}
                  onTransformEnd={() => {
                    const node = productRef.current
                    const scaleX = node.scaleX()
                    const scaleY = node.scaleY()

                    node.scaleX(1)
                    node.scaleY(1)

                    setProductPosition({
                      x: node.x() / scale,
                      y: node.y() / scale,
                      width: Math.max(50, node.width() * scaleX / scale),
                      height: Math.max(50, node.height() * scaleY / scale)
                    })
                  }}
                />
                {isSelected && (
                  <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (Math.abs(newBox.width) < 50 || Math.abs(newBox.height) < 50) {
                        return oldBox
                      }
                      return newBox
                    }}
                  />
                )}
              </>
            )}
          </Layer>

          <Layer>
            {scaledTop > 0 && (
              <Group>
                <Line
                  points={[0, scaledTop, stageSize.width, scaledTop]}
                  stroke="#ec6608"
                  strokeWidth={1}
                  dash={[5, 5]}
                />
                <Line
                  points={[stageSize.width / 2, 0, stageSize.width / 2, scaledTop]}
                  stroke="#ec6608"
                  strokeWidth={1}
                  dash={[5, 5]}
                />
                <Line
                  points={[0, scaledTop / 2, stageSize.width, scaledTop / 2]}
                  stroke="#ec6608"
                  strokeWidth={1}
                  dash={[5, 5]}
                />
                <Text
                  x={12}
                  y={scaledTop - 16}
                  text="RESTRICTED: 200PX"
                  fontSize={10 * scale}
                  fill="#ec6608"
                  fontFamily="Roboto Condensed, sans-serif"
                  fontStyle="normal"
                />
              </Group>
            )}
            {scaledBottom > 0 && (
              <Group>
                <Line
                  points={[0, stageSize.height - scaledBottom, stageSize.width, stageSize.height - scaledBottom]}
                  stroke="#ec6608"
                  strokeWidth={1}
                  dash={[5, 5]}
                />
                <Line
                  points={[stageSize.width / 2, stageSize.height - scaledBottom, stageSize.width / 2, stageSize.height]}
                  stroke="#ec6608"
                  strokeWidth={1}
                  dash={[5, 5]}
                />
                <Line
                  points={[0, stageSize.height - scaledBottom / 2, stageSize.width, stageSize.height - scaledBottom / 2]}
                  stroke="#ec6608"
                  strokeWidth={1}
                  dash={[5, 5]}
                />
                <Text
                  x={12}
                  y={stageSize.height - scaledBottom + 4}
                  text="RESTRICTED: 250PX"
                  fontSize={10 * scale}
                  fill="#ec6608"
                  fontFamily="Roboto Condensed, sans-serif"
                  fontStyle="normal"
                />
              </Group>
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
