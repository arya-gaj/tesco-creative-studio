import { useState } from 'react'
import { motion } from 'framer-motion'

export default function CommandCenter({ onGenerate, isGenerating, generationStage, onVerify, canvasState, verificationResult }) {
  const [input, setInput] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (input.trim() && !isGenerating) {
      await onGenerate(input.trim())
    }
  }

  return (
    <div className="h-full flex flex-col bg-white/80 backdrop-blur-xl">
      <div className="p-4 border-b border-slate-200/60">
        <h2 className="text-sm font-semibold text-slate-800 mb-1 tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>Generate</h2>
        <p className="text-xs text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>AI-driven creative generation</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Creative Prompt
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your retail creative requirements..."
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-retail-cyan focus:ring-2 focus:ring-retail-cyan/20 transition-all resize-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
              rows={6}
              disabled={isGenerating}
            />
          </div>

          <motion.button
            whileHover={{ scale: isGenerating ? 1 : 1.01 }}
            whileTap={{ scale: isGenerating ? 1 : 0.99 }}
            type="submit"
            disabled={isGenerating || !input.trim()}
            className="w-full bg-retail-cyan hover:bg-retail-cyan/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {isGenerating ? (
              <>
                <motion.svg
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </motion.svg>
                <span className="text-sm">
                  {generationStage === 'planning' ? 'Planning assets...' :
                   generationStage === 'fetching_assets' ? 'Fetching assets...' :
                   generationStage === 'generating' ? 'Generating image...' : 'Processing...'}
                </span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm">Generate Creative</span>
              </>
            )}
          </motion.button>
        </form>

        {canvasState && (
          <div className="pt-4 border-t border-muted-gray/10">
            <h3 className="text-xs font-medium text-slate-600 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Verify & Deploy</h3>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onVerify}
              className="w-full bg-retail-cyan hover:bg-retail-cyan/90 text-carbon font-semibold py-3 rounded-md transition-all flex items-center justify-center gap-2"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm">Verify & Commit</span>
            </motion.button>

            {verificationResult && (
              <div className="mt-4 p-3 bg-carbon border border-retail-cyan/20 rounded-md space-y-2">
                <div>
                  <p className="text-xs text-muted-gray mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Hash</p>
                  <p className="text-xs text-retail-cyan font-mono-tech break-all" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{verificationResult.hash}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-gray mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Block ID</p>
                  <p className="text-xs text-retail-cyan font-mono-tech break-all" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{verificationResult.block_id}</p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-retail-cyan rounded-full animate-pulse" />
                  <span className="text-xs text-muted-gray" style={{ fontFamily: 'Inter, sans-serif' }}>Verified</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
