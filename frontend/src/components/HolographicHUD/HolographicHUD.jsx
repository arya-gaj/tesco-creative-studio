import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function HolographicHUD({ toonToken, proofOfCompliance }) {
  const [scrollingData, setScrollingData] = useState('')

  useEffect(() => {
    if (toonToken) {
      const jsonString = JSON.stringify(toonToken, null, 2)
      setScrollingData(jsonString)
    }
  }, [toonToken])

  if (!toonToken) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-emerald-400/50 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 mx-auto bg-emerald-400/10 border border-emerald-400/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <svg className="w-10 h-10 text-emerald-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-emerald-400/70">HOLOGRAPHIC HUD</p>
          <p className="text-xs text-emerald-400/50">Awaiting TOON data stream...</p>
        </motion.div>
      </div>
    )
  }

  const { compliance_score, violations, warnings, layout } = toonToken
  const scoreColor = compliance_score >= 0.8 ? 'text-emerald-400' : 
                     compliance_score >= 0.5 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-transparent to-emerald-400/5">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border-b border-emerald-400/20"
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-emerald-400 font-mono">HUD v2.0</h2>
            <p className="text-xs text-emerald-400/70 mt-0.5 font-mono">COMPLIANCE MONITOR</p>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-emerald-400/70 font-mono">COMPLIANCE_SCORE</span>
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={`text-3xl font-bold ${scoreColor} font-mono`}
            >
              {(compliance_score * 100).toFixed(0)}%
            </motion.span>
          </div>
          <div className="w-full bg-emerald-400/10 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${compliance_score * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-2 rounded-full ${
                compliance_score >= 0.8 ? 'bg-emerald-400' :
                compliance_score >= 0.5 ? 'bg-yellow-400' : 
                'bg-red-400'
              }`}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4 backdrop-blur-sm"
        >
          <h3 className="text-xs font-bold text-emerald-400 mb-3 font-mono">COMPLIANCE_CHECKLIST</h3>
          <div className="space-y-2 text-emerald-400/80 font-mono text-xs">
            {[
              { label: 'TESCO_BLUE', check: layout.brand_color?.primary === '#00539f' },
              { label: 'SAFE_ZONES', check: layout.safe_zone?.top === 200 && layout.safe_zone?.bottom === 250 },
              { label: 'REQUIRED_TAG', check: layout.tags?.some(t => t.text?.includes('Tesco')) },
              { label: 'NO_VIOLATIONS', check: violations?.length === 0 },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="flex items-center space-x-2"
              >
                <span className={item.check ? 'text-emerald-400' : 'text-red-400'}>
                  {item.check ? 'PASS' : 'FAIL'}
                </span>
                <span>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {violations && violations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-red-400/10 border border-red-400/30 rounded-xl p-4 backdrop-blur-sm"
          >
            <h3 className="text-xs font-bold text-red-400 mb-2 font-mono">VIOLATIONS</h3>
            <ul className="space-y-1 text-red-400/80 font-mono text-xs">
              {violations.slice(0, 3).map((v, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="flex items-start space-x-2"
                >
                  <span className="text-red-400">&gt;</span>
                  <span>{v}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4 backdrop-blur-sm overflow-hidden"
        >
          <h3 className="text-xs font-bold text-emerald-400 mb-2 font-mono">TOON_DATA_STREAM</h3>
          <div className="relative h-48 overflow-hidden">
            <motion.pre
              initial={{ y: 0 }}
              animate={{ y: [0, -100] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="text-xs text-emerald-400/70 font-mono whitespace-pre-wrap"
            >
              {scrollingData}
            </motion.pre>
          </div>
        </motion.div>

        {proofOfCompliance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4 backdrop-blur-sm"
          >
            <h3 className="text-xs font-bold text-emerald-400 mb-2 font-mono">BLOCKCHAIN_PROOF</h3>
            <p className="text-xs text-emerald-400/70 font-mono break-all">
              {proofOfCompliance.transaction_id || proofOfCompliance.compliance_hash || 'VERIFIED'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}