import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function LandingPage() {
  const navigate = useNavigate()
  const [isInitializing, setIsInitializing] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)

  const handleInitialize = () => {
    setIsInitializing(true)
    setScanProgress(0)

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            navigate('/studio')
          }, 500)
          return 100
        }
        return prev + 2
      })
    }, 30)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-screen w-screen overflow-hidden relative bg-gradient-to-br from-slate-50 via-white to-blue-50"
    >
      <div className="absolute inset-0 bg-grid-enterprise opacity-5" />

      <div className="absolute inset-0 flex flex-col z-10">
        <div className="flex-1 flex items-center justify-center px-8 py-4">
          <div className="w-full max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                Clubcard Points Bandit Labs
              </h1>
              <p className="text-lg text-slate-600 font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
                Enterprise platform for AI-generated and blockchain-verified retail creatives
              </p>
            </motion.div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-6 rounded-xl shadow-lg"
              >
                <div className="w-8 h-8 mb-4 flex items-center justify-center border border-retail-cyan/30 rounded-lg bg-retail-cyan/10">
                  <svg className="w-5 h-5 text-retail-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-slate-800 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Generate</h3>
                <p className="text-sm text-slate-600 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  AI-driven layout generation with precise asset placement and background synthesis
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-6 rounded-xl shadow-lg"
              >
                <div className="w-8 h-8 mb-4 flex items-center justify-center border border-retail-cyan/30 rounded-lg bg-retail-cyan/10">
                  <svg className="w-5 h-5 text-retail-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-slate-800 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Verify</h3>
                <p className="text-sm text-slate-600 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Blockchain-verified provenance with immutable audit trails and compliance records
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-6 rounded-xl shadow-lg"
              >
                <div className="w-8 h-8 mb-4 flex items-center justify-center border border-retail-cyan/30 rounded-lg bg-retail-cyan/10">
                  <svg className="w-5 h-5 text-retail-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-slate-800 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Deploy</h3>
                <p className="text-sm text-slate-600 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Production-ready creatives with full documentation and verification certificates
                </p>
              </motion.div>
            </div>

            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              onClick={handleInitialize}
              disabled={isInitializing}
              className="w-full bg-retail-cyan hover:bg-retail-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {isInitializing ? (
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
                  <span>Initializing Platform...</span>
                  <span className="text-sm font-mono-tech">{scanProgress}%</span>
                </>
              ) : (
                <>
                  <span>Launch Studio</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </motion.button>
          </div>
        </div>

        <div className="border-t border-slate-200/60 p-4 bg-white/60 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-600" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            <span>STATUS: {isInitializing ? 'INITIALIZING' : 'READY'}</span>
            <span>BUILD: 2025.01.01</span>
            <span>VERSION: 1.0.0</span>
          </div>
        </div>
      </div>

      <svg className="absolute inset-0 pointer-events-none opacity-5" style={{ mixBlendMode: 'screen' }}>
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#38e8ff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </motion.div>
  )
}
