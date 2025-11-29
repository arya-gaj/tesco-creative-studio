import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function LandingPage() {
  const navigate = useNavigate()
  const [isInitializing, setIsInitializing] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [dataLines, setDataLines] = useState([])

  useEffect(() => {
    const lines = [
      '> SYSTEM INITIALIZATION SEQUENCE STARTED',
      '> LOADING CORE MODULES...',
      '> CONNECTING TO AI ENGINE...',
      '> VERIFYING ASSET LIBRARY...',
      '> CALIBRATING CANVAS RESOLUTION...',
      '> ESTABLISHING BLOCKCHAIN CONNECTION...',
      '> ALL SYSTEMS OPERATIONAL',
    ]

    const interval = setInterval(() => {
      setDataLines(prev => {
        if (prev.length < lines.length) {
          return [...prev, lines[prev.length]]
        }
        return prev
      })
    }, 800)

    return () => clearInterval(interval)
  }, [])

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
      className="h-screen w-screen overflow-hidden relative bg-white"
    >
      <div className="absolute inset-0 bg-grid-slate-200 opacity-30" />

      <div className="absolute inset-0 flex flex-col z-10">
        <div className="flex-1 flex items-center justify-center px-8 py-4">
          <div className="w-full max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-7xl font-black text-[#003349] uppercase tracking-tighter mb-2"
              style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '-0.05em' }}
            >
              TESCO CREATIVE STUDIO
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-[#2d373c] uppercase tracking-wider mb-6"
              style={{ fontFamily: 'Roboto Condensed, sans-serif', fontWeight: 300 }}
            >
              V1.0
            </motion.p>

            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-300 rounded-md p-4 h-48 overflow-hidden">
                <div className="font-mono text-xs text-[#2d373c] space-y-0.5 h-full overflow-y-auto">
                  <AnimatePresence>
                    {dataLines.map((line, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {line}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {dataLines.length === 7 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-[#ec6608] mt-2"
                    >
                      {'> READY FOR INITIALIZATION'}
                    </motion.div>
                  )}
                </div>
              </div>

              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                onClick={handleInitialize}
                disabled={isInitializing || dataLines.length < 7}
                className="w-full bg-[#ec6608] hover:bg-[#d45a07] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 border-2 border-[#ec6608] rounded-md transition-all uppercase tracking-wider text-lg"
                style={{ fontFamily: 'Oswald, sans-serif' }}
              >
                {isInitializing ? (
                  <div className="flex flex-col items-center gap-2">
                    <span>SYSTEM SCANNING...</span>
                    <div className="w-full max-w-md h-2 bg-slate-200 border border-slate-400 rounded-md">
                      <motion.div
                        className="h-full bg-[#ec6608] rounded-md"
                        initial={{ width: 0 }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <span className="text-sm">{scanProgress}%</span>
                  </div>
                ) : (
                  'INITIALIZE SEQUENCE'
                )}
              </motion.button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-300 p-3 bg-slate-50">
          <div className="flex items-center justify-between text-xs text-[#2d373c]" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
            <span>STATUS: {dataLines.length === 7 ? 'READY' : 'INITIALIZING'}</span>
            <span>BUILD: 2025.01.01</span>
          </div>
        </div>
      </div>

      <svg className="absolute inset-0 pointer-events-none opacity-10" style={{ mixBlendMode: 'multiply' }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#003349" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </motion.div>
  )
}