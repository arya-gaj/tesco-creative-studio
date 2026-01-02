import { useState } from 'react'

export default function PropertiesPanel({ selectedElement, onUpdate, canvasBackgroundColor, onCanvasBackgroundChange }) {
  const [hexInputs, setHexInputs] = useState({})

  const handleHexChange = (key, value) => {
    const cleaned = value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6).toUpperCase()
    setHexInputs(prev => ({ ...prev, [key]: cleaned }))
    if (cleaned.length === 6) {
      const colorKey = key === 'textFill' ? 'fill' : key
      onUpdate({ [colorKey]: `#${cleaned}` })
    }
  }

  if (!selectedElement) {
    return (
      <div className="w-64 border-l border-slate-200/60 bg-white/80 backdrop-blur-xl p-4 flex flex-col h-full">
        <h3 className="text-xs font-semibold text-slate-800 mb-4 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Properties</h3>
        <div className="flex-1 flex flex-col space-y-3">
          <div>
            <label className="block text-xs text-slate-600 mb-2 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
              Canvas Background
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={canvasBackgroundColor || '#ffffff'}
                onChange={(e) => onCanvasBackgroundChange(e.target.value)}
                className="h-10 w-16 bg-white border border-slate-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={canvasBackgroundColor || '#ffffff'}
                onChange={(e) => {
                  const val = e.target.value
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                    onCanvasBackgroundChange(val)
                  }
                }}
                placeholder="#ffffff"
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-500 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              Select an element to edit properties
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 border-l border-slate-200/40 bg-white/70 backdrop-blur-2xl p-5 flex flex-col h-full">
      <h3 className="text-xs font-semibold text-slate-800 mb-5 uppercase tracking-wider flex-shrink-0" style={{ fontFamily: 'Inter, sans-serif' }}>Properties</h3>
      
      <div className="flex-1 flex flex-col justify-between min-h-0">
        <div className="space-y-4 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin" style={{ scrollbarWidth: 'thin', scrollbarColor: 'transparent transparent' }}>
          <div>
            <label className="block text-xs text-slate-600 mb-2 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
              Type
            </label>
            <div className="px-4 py-3 bg-white/90 border border-slate-200/60 rounded-xl text-slate-800 text-xs capitalize" style={{ fontFamily: 'Inter, sans-serif' }}>
              {selectedElement.type}
            </div>
          </div>

          {selectedElement.type === 'text' && (
            <>
              <div>
                <label className="block text-xs text-slate-600 mb-2 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Text Content
                </label>
                <input
                  type="text"
                  value={selectedElement.text || ''}
                  onChange={(e) => onUpdate({ text: e.target.value })}
                  className="w-full px-4 py-3 text-xs bg-white/90 border border-slate-200/60 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-2 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Font Size
                </label>
                <input
                  type="number"
                  value={Math.round(selectedElement.fontSize || 48)}
                  onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 48 })}
                  min="12"
                  max="200"
                  className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-2 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Font Family
                </label>
                <select
                  value={selectedElement.fontFamily || 'Inter, sans-serif'}
                  onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <option value="Inter, sans-serif">Inter</option>
                  <option value="IBM Plex Sans, sans-serif">IBM Plex Sans</option>
                  <option value="IBM Plex Mono, monospace">IBM Plex Mono</option>
                  <option value="Manrope, sans-serif">Manrope</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-2 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Text Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={selectedElement.fill || '#64748b'}
                    onChange={(e) => {
                      onUpdate({ fill: e.target.value })
                      setHexInputs(prev => ({ ...prev, textFill: e.target.value.replace('#', '') }))
                    }}
                    className="h-10 w-16 bg-white border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={hexInputs.textFill || (selectedElement.fill || '#64748b').replace('#', '')}
                    onChange={(e) => handleHexChange('textFill', e.target.value)}
                    placeholder="000000"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20 uppercase"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
              </div>
            </>
          )}

          {selectedElement.type === 'image' && (
            <>
              <div>
                <label className="block text-xs text-slate-600 mb-2 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Width
                </label>
                <input
                  type="number"
                  value={Math.round(selectedElement.width || 400)}
                  onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 400 })}
                  min="50"
                  className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-2 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Height
                </label>
                <input
                  type="number"
                  value={Math.round(selectedElement.height || 400)}
                  onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 400 })}
                  min="50"
                  className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </>
          )}

          {(selectedElement.type === 'rectangle' || selectedElement.type === 'circle' || selectedElement.type === 'line' || selectedElement.type === 'arrow' || selectedElement.type === 'drawing') && (
            <>
              <div>
                <label className="block text-xs text-slate-600 mb-2 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Stroke Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={selectedElement.stroke || '#64748b'}
                    onChange={(e) => {
                      onUpdate({ stroke: e.target.value })
                      setHexInputs(prev => ({ ...prev, stroke: e.target.value.replace('#', '') }))
                    }}
                    className="h-10 w-16 bg-white border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={hexInputs.stroke || (selectedElement.stroke || '#64748b').replace('#', '')}
                    onChange={(e) => handleHexChange('stroke', e.target.value)}
                    placeholder="000000"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20 uppercase"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
              </div>

              {(selectedElement.type === 'rectangle' || selectedElement.type === 'circle') && (
                <div>
                  <label className="block text-xs text-slate-600 mb-2 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Fill Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedElement.fill === 'transparent' ? '#ffffff' : (selectedElement.fill || '#ffffff')}
                      onChange={(e) => {
                        onUpdate({ fill: e.target.value })
                        setHexInputs(prev => ({ ...prev, fill: e.target.value.replace('#', '') }))
                      }}
                      className="h-10 w-16 bg-white border border-slate-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={hexInputs.fill || (selectedElement.fill === 'transparent' ? 'ffffff' : (selectedElement.fill || '#ffffff').replace('#', ''))}
                      onChange={(e) => handleHexChange('fill', e.target.value)}
                      placeholder="ffffff"
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20 uppercase"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                  </div>
                </div>
              )}

              {selectedElement.type === 'arrow' && (
                <div>
                  <label className="block text-xs text-slate-600 mb-2 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Fill Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedElement.fill || '#64748b'}
                      onChange={(e) => {
                        onUpdate({ fill: e.target.value })
                        setHexInputs(prev => ({ ...prev, fill: e.target.value.replace('#', '') }))
                      }}
                      className="h-10 w-16 bg-white border border-slate-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={hexInputs.fill || (selectedElement.fill || '#64748b').replace('#', '')}
                      onChange={(e) => handleHexChange('fill', e.target.value)}
                      placeholder="000000"
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20 uppercase"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-600 mb-2 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Stroke Width
                </label>
                <input
                  type="number"
                  value={Math.round(selectedElement.strokeWidth || 3)}
                  onChange={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) || 3 })}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {selectedElement.type === 'rectangle' && (
                <>
                  <div>
                    <label className="block text-xs text-slate-600 mb-2 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Width
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.width || 100)}
                      onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 100 })}
                      min="20"
                      className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-2 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Height
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedElement.height || 100)}
                      onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 100 })}
                      min="20"
                      className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                  </div>
                </>
              )}

              {selectedElement.type === 'circle' && (
                <div>
                  <label className="block text-xs text-slate-600 mb-2 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Radius
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedElement.radius || 50)}
                    onChange={(e) => onUpdate({ radius: parseInt(e.target.value) || 50 })}
                    min="10"
                    className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs text-slate-600 mb-3 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
              Position X
            </label>
            <input
              type="number"
              value={Math.round(selectedElement.x || 0)}
              onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 text-xs bg-white/90 border border-slate-200/60 rounded-xl text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-3 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
              Position Y
            </label>
            <input
              type="number"
              value={Math.round(selectedElement.y || 0)}
              onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 text-xs bg-white/90 border border-slate-200/60 rounded-xl text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-3 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
              Rotation
            </label>
            <input
              type="number"
              value={Math.round(selectedElement.rotation || 0)}
              onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) || 0 })}
              min="0"
              max="360"
              className="w-full px-4 py-3 text-xs bg-white/90 border border-slate-200/60 rounded-xl text-slate-800 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
