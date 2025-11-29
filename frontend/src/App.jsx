import { useState } from 'react'
import { motion } from 'framer-motion'
import CommandCenter from './components/CommandCenter/CommandCenter'
import Canvas from './components/Canvas/Canvas'
import AssetLibrary from './components/AssetLibrary/AssetLibrary'
import SettingsModal from './components/SettingsModal/SettingsModal'
import { generateCreative, verifyCanvas, fetchAssets } from './utils/api'

function Studio() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState(null)
  const [aiLayout, setAiLayout] = useState(null)
  const [canvasState, setCanvasState] = useState(null)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [assets, setAssets] = useState([])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [transactionId, setTransactionId] = useState(null)

  const handleGenerate = async (prompt) => {
    setIsGenerating(true)
    setGenerationStage('generating')
    setAiLayout(null)
    setAssets([])

    try {
      const [generateResult, assetsResult] = await Promise.all([
        generateCreative(prompt).catch(err => {
          console.error('Generate error:', err)
          throw err
        }),
        fetchAssets(prompt).catch(err => {
          console.warn('Assets fetch error:', err)
          return { images: [] }
        })
      ])

      setAiLayout(generateResult)
      setAssets(assetsResult.images || [])
      setGenerationStage(null)
    } catch (error) {
      console.error('Generation error:', error)
      alert(`Generation failed: ${error.message}`)
      setGenerationStage(null)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleVerify = async () => {
    if (!canvasState) {
      alert('No canvas state to verify')
      return
    }

    try {
      const result = await verifyCanvas(canvasState)
      setTransactionId(result.transaction_id)
      alert(`Canvas verified! Transaction ID: ${result.transaction_id}`)
    } catch (error) {
      console.error('Verification error:', error)
      alert(`Verification failed: ${error.message}`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-screen w-screen overflow-hidden bg-white"
    >
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-3 bg-white border border-slate-300 hover:border-[#003349] text-[#2d373c] hover:text-[#003349] transition-all rounded-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <div className="flex h-full gap-2 p-2 relative z-10">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-80 bg-[#003349] border border-slate-300 rounded-md overflow-hidden"
        >
          <CommandCenter
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            generationStage={generationStage}
            onVerify={handleVerify}
            canvasState={canvasState}
            transactionId={transactionId}
          />
        </motion.div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex-1 bg-white border border-slate-300 rounded-md overflow-hidden"
        >
          <Canvas
            aiLayout={aiLayout}
            onCanvasStateChange={setCanvasState}
            selectedAsset={selectedAsset}
          />
        </motion.div>

        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="w-80 bg-white border border-slate-300 rounded-md overflow-hidden"
        >
          <AssetLibrary
            assets={assets}
            selectedAsset={selectedAsset}
            onAssetSelect={setSelectedAsset}
          />
        </motion.div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </motion.div>
  )
}

export default Studio
