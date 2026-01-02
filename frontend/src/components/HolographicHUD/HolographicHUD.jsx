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
      <div className="h-full flex flex-col items-center justify-center text-muted-gray p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto bg-graphite border border-retail-cyan/20 rounded-md flex items-center justify-center">
            <svg className="w-8 h-8 text-retail-cyan/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-soft-white" style={{ fontFamily: 'Inter, sans-serif' }}>Verification Monitor</p>
          <p className="text-xs text-muted-gray" style={{ fontFamily: 'Inter, sans-serif' }}>Awaiting data stream...</p>
        </motion.div>
      </div>
    )
  }

  const { compliance_score, violations, warnings, layout } = toonToken
  const scoreColor = compliance_score >= 0.8 ? 'text-retail-cyan' : 
                     compliance_score >= 0.5 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="h-full flex flex-col bg-carbon">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-b border-muted-gray/10"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-md bg-graphite border border-retail-cyan/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-retail-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-soft-white" style={{ fontFamily: 'Inter, sans-serif' }}>Verification Monitor</h2>
            <p className="text-xs text-muted-gray mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>Compliance Status</p>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-graphite border border-muted-gray/20 rounded-md p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-gray" style={{ fontFamily: 'Inter, sans-serif' }}>Compliance Score</span>
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={`text-2xl font-semibold ${scoreColor}`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {(compliance_score * 100).toFixed(0)}%
            </motion.span>
          </div>
          <div className="w-full bg-carbon rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${compliance_score * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-1.5 rounded-full ${
                compliance_score >= 0.8 ? 'bg-retail-cyan' :
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
          className="bg-graphite border border-muted-gray/20 rounded-md p-4"
        >
          <h3 className="text-xs font-medium text-soft-white mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Compliance Checklist</h3>
          <div className="space-y-2 text-muted-gray text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
            {[
              { label: 'Brand Color', check: layout.brand_color?.primary === '#00539f' },
              { label: 'Safe Zones', check: layout.safe_zone?.top === 200 && layout.safe_zone?.bottom === 250 },
              { label: 'Required Tag', check: layout.tags?.some(t => t.text?.includes('Clubcard Points Bandit Labs')) },
              { label: 'No Violations', check: violations?.length === 0 },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="flex items-center space-x-2"
              >
                <span className={item.check ? 'text-retail-cyan' : 'text-red-400'} style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
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
            className="bg-graphite border border-red-400/30 rounded-md p-4"
          >
            <h3 className="text-xs font-medium text-red-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Violations</h3>
            <ul className="space-y-1 text-red-400/80 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
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
          className="bg-graphite border border-muted-gray/20 rounded-md p-4 overflow-hidden"
        >
          <h3 className="text-xs font-medium text-soft-white mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Data Stream</h3>
          <div className="relative h-40 overflow-hidden">
            <motion.pre
              initial={{ y: 0 }}
              animate={{ y: [0, -100] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="text-xs text-retail-cyan/70 font-mono-tech whitespace-pre-wrap"
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
            className="bg-graphite border border-retail-cyan/20 rounded-md p-4"
          >
            <h3 className="text-xs font-medium text-soft-white mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Blockchain Proof</h3>
            <p className="text-xs text-retail-cyan font-mono-tech break-all">
              {proofOfCompliance.transaction_id || proofOfCompliance.compliance_hash || 'VERIFIED'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
