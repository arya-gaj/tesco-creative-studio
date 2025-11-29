import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getApiUrl, setApiUrl } from '../../utils/api'

export default function SettingsModal({ isOpen, onClose }) {
  const [apiUrl, setApiUrlState] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      const current = getApiUrl()
      setApiUrlState(current || '')
      setError('')
    }
  }, [isOpen])

  const handleSave = () => {
    if (!apiUrl.trim()) {
      setError('API URL cannot be empty')
      return
    }

    try {
      const url = new URL(apiUrl)
      if (!url.protocol.startsWith('http')) {
        setError('URL must start with http:// or https://')
        return
      }

      setApiUrl(apiUrl)
      setError('')
      onClose()
    } catch (e) {
      setError('Invalid URL format')
    }
  }

  const handleTest = async () => {
    if (!apiUrl.trim()) {
      setError('API URL cannot be empty')
      return
    }

    try {
      const url = new URL(apiUrl)
      if (!url.protocol.startsWith('http')) {
        setError('URL must start with http:// or https://')
        return
      }

      setError('')
      const testUrl = `${apiUrl.replace(/\/$/, '')}/health`
      const response = await fetch(testUrl, { method: 'GET' })

      if (response.ok) {
        alert('✓ Connection successful!')
      } else {
        setError(`Connection failed: ${response.status}`)
      }
    } catch (e) {
      setError(`Connection error: ${e.message}`)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-300 rounded-md p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#003349] uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  <svg className="w-6 h-6 text-[#003349]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  SETTINGS
                </h2>
                <button
                  onClick={onClose}
                  className="text-[#2d373c] hover:text-[#003349] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#2d373c] mb-2 uppercase tracking-wider" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                    Backend API URL (ngrok link)
                  </label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => {
                      setApiUrlState(e.target.value)
                      setError('')
                    }}
                    placeholder="https://xxxx-xxxx-xxxx.ngrok.io"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-[#2d373c] placeholder-slate-400 focus:outline-none focus:border-[#ec6608] transition-all"
                    style={{ fontFamily: 'Roboto Condensed, sans-serif' }}
                  />
                  <p className="mt-2 text-xs text-[#2d373c]" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                    Enter your Google Colab ngrok tunnel URL
                  </p>
                </div>

                {error && (
                  <div className="px-4 py-3 bg-red-50 border border-red-300 rounded-md text-red-700 text-sm" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleTest}
                    className="flex-1 px-4 py-3 bg-white border border-slate-300 hover:border-slate-400 rounded-md text-[#2d373c] font-bold transition-all uppercase"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    Test Connection
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-3 bg-[#ec6608] hover:bg-[#d45a07] rounded-md text-white font-bold transition-all border border-[#ec6608] uppercase"
                    style={{ fontFamily: 'Oswald, sans-serif' }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
