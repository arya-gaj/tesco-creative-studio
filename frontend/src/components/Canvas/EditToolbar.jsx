import { motion } from 'framer-motion'
import { useState } from 'react'

export default function EditToolbar({ 
  onAddText, 
  onRotate, 
  onColorChange, 
  onRemoveBackground,
  onDownload,
  selectedElement,
  onFlipHorizontal,
  onFlipVertical,
  onDelete,
  onBringToFront,
  onSendToBack,
  activeTool,
  onToolChange
}) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textValue, setTextValue] = useState('')
  const [selectedColor, setSelectedColor] = useState('#64748b')

  const presetColors = [
    '#ffffff', '#000000', '#00539f', '#38e8ff', '#ec6608',
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff',
    '#00ffff', '#808080', '#ffa500', '#800080', '#ffc0cb'
  ]

  const handleColorSelect = (color) => {
    setSelectedColor(color)
    setShowColorPicker(false)
    if (onColorChange) {
      onColorChange(color)
    }
  }

  const handleAddText = () => {
    if (textValue.trim()) {
      onAddText(textValue.trim(), selectedColor)
      setTextValue('')
      setShowTextInput(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl overflow-x-auto scrollbar-thin" style={{ scrollbarWidth: 'thin', scrollbarColor: 'transparent transparent' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Tools</span>
          <div className="w-px h-4 bg-slate-300/40" />
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToolChange(null)}
            className={`p-2 border rounded-xl transition-all ${!activeTool ? 'bg-retail-cyan border-retail-cyan text-white' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'}`}
            title="Select & Move"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTextInput(!showTextInput)}
            className={`p-2 border rounded-lg transition-all ${activeTool === 'text' ? 'bg-retail-cyan border-retail-cyan text-white' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'}`}
            title="Add Text"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToolChange(activeTool === 'draw' ? null : 'draw')}
            className={`p-2 border rounded-lg transition-all ${activeTool === 'draw' ? 'bg-retail-cyan border-retail-cyan text-white' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'}`}
            title="Draw"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToolChange(activeTool === 'rectangle' ? null : 'rectangle')}
            className={`p-2 border rounded-xl transition-all ${activeTool === 'rectangle' ? 'bg-retail-cyan border-retail-cyan text-white' : 'bg-white/90 hover:bg-slate-50 border-slate-200/60 text-slate-700'}`}
            title="Rectangle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToolChange(activeTool === 'circle' ? null : 'circle')}
            className={`p-2 border rounded-xl transition-all ${activeTool === 'circle' ? 'bg-retail-cyan border-retail-cyan text-white' : 'bg-white/90 hover:bg-slate-50 border-slate-200/60 text-slate-700'}`}
            title="Circle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToolChange(activeTool === 'line' ? null : 'line')}
            className={`p-2 border rounded-xl transition-all ${activeTool === 'line' ? 'bg-retail-cyan border-retail-cyan text-white' : 'bg-white/90 hover:bg-slate-50 border-slate-200/60 text-slate-700'}`}
            title="Line"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToolChange(activeTool === 'arrow' ? null : 'arrow')}
            className={`p-2 border rounded-xl transition-all ${activeTool === 'arrow' ? 'bg-retail-cyan border-retail-cyan text-white' : 'bg-white/90 hover:bg-slate-50 border-slate-200/60 text-slate-700'}`}
            title="Arrow"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </motion.button>

          {selectedElement && (
            <>
              <div className="w-px h-4 bg-slate-300/40" />
              <span className="text-xs text-slate-600 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Transform</span>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRotate}
                className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 transition-all"
                title="Rotate 90°"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onFlipHorizontal}
                className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 transition-all"
                title="Flip Horizontal"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onFlipVertical}
                className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 transition-all"
                title="Flip Vertical"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </motion.button>

              <div className="w-px h-4 bg-slate-300/40" />
              <span className="text-xs text-slate-600 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Layer</span>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBringToFront}
                className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 transition-all"
                title="Bring to Front"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSendToBack}
                className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 transition-all"
                title="Send to Back"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              </motion.button>

              {selectedElement.type === 'image' && (
                <>
                  <div className="w-px h-4 bg-slate-300/40" />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onRemoveBackground}
                    className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 transition-all"
                    title="Remove Background"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </motion.button>
                </>
              )}

              <div className="w-px h-4 bg-slate-300/40" />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDelete}
                className="p-2 bg-white hover:bg-red-50 border border-red-300 rounded-lg text-red-600 transition-all"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </motion.button>
            </>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {selectedElement && (selectedElement.type === 'text' || selectedElement.type === 'rectangle' || selectedElement.type === 'circle' || selectedElement.type === 'drawing' || selectedElement.type === 'line' || selectedElement.type === 'arrow') && (
            <>
              <span className="text-xs text-slate-600 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Color</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-all relative"
                title="Change Color"
              >
                <div className="w-5 h-5 rounded-sm" style={{ backgroundColor: selectedElement.fill || selectedElement.stroke || selectedColor }} />
              </motion.button>
            </>
          )}

          <div className="w-px h-4 bg-slate-300/40" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDownload}
            className="px-3 py-1.5 bg-retail-cyan hover:bg-retail-cyan/90 border border-retail-cyan rounded-lg text-white transition-all font-medium text-xs flex items-center gap-1.5 shadow-md"
            title="Download Creative"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </motion.button>
        </div>
      </div>

      {showTextInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 py-3 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Enter text..."
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20"
              style={{ fontFamily: 'Inter, sans-serif' }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddText()
                } else if (e.key === 'Escape') {
                  setShowTextInput(false)
                  setTextValue('')
                }
              }}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddText}
              className="px-4 py-2 bg-retail-cyan hover:bg-retail-cyan/90 text-white text-xs font-medium rounded-lg transition-all shadow-md"
            >
              Add Text
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowTextInput(false)
                setTextValue('')
              }}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg transition-all"
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      )}

      {showColorPicker && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 py-3 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl"
        >
          <div className="space-y-2">
            <div className="grid grid-cols-8 gap-2">
              {presetColors.map((color) => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleColorSelect(color)}
                  className="w-8 h-8 rounded-lg border border-slate-300 hover:border-retail-cyan transition-all shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>Custom:</span>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="h-8 w-20 rounded-lg cursor-pointer border border-slate-300 shadow-sm"
              />
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}
