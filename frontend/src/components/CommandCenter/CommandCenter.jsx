import { useState } from 'react'
import { motion } from 'framer-motion'

export default function CommandCenter({ onGenerate, isGenerating, generationStage, onVerify, canvasState, transactionId }) {
  const [input, setInput] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (input.trim() && !isGenerating) {
      await onGenerate(input.trim())
      setInput('')
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#003349]">
      <div className="p-3 border-b border-slate-400 rounded-t-md">
        <h2 className="text-base font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>COMMAND CENTER</h2>
        <p className="text-xs text-slate-300 mt-0.5" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>AI Creative Studio</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
              Creative Prompt
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your creative request..."
              className="w-full px-3 py-2 bg-white border border-slate-400 rounded-md text-[#2d373c] placeholder-slate-400 focus:outline-none focus:border-[#ec6608] transition-all resize-none"
              style={{ fontFamily: 'Roboto Condensed, sans-serif' }}
              rows={6}
              disabled={isGenerating}
            />
          </div>

          <motion.button
            whileHover={{ scale: isGenerating ? 1 : 1.02 }}
            whileTap={{ scale: isGenerating ? 1 : 0.98 }}
            type="submit"
            disabled={isGenerating || !input.trim()}
            className="w-full bg-[#ec6608] hover:bg-[#d45a07] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 border border-[#ec6608] rounded-md transition-all flex items-center justify-center gap-2"
            style={{ fontFamily: 'Oswald, sans-serif' }}
          >
            {isGenerating ? (
              <>
                <motion.svg
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </motion.svg>
                <span className="text-sm font-bold uppercase">
                  {generationStage === 'generating' ? 'GENERATING...' : 'PROCESSING...'}
                </span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-bold uppercase">GENERATE</span>
              </>
            )}
          </motion.button>
        </form>

        {canvasState && (
          <div className="pt-4 border-t border-slate-500">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onVerify}
              className="w-full bg-[#ec6608] hover:bg-[#d45a07] text-white font-bold py-3 border border-[#ec6608] rounded-md transition-all flex items-center justify-center gap-2"
              style={{ fontFamily: 'Oswald, sans-serif' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-bold uppercase">VERIFY & COMMIT</span>
            </motion.button>

            {transactionId && (
              <div className="mt-4 p-3 bg-slate-800 border border-slate-600 rounded-md">
                <p className="text-xs text-slate-300 mb-1 uppercase" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>Transaction ID</p>
                <p className="text-xs text-white font-mono break-all" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>{transactionId}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
