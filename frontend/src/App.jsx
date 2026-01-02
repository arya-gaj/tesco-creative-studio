import { useState } from 'react'
import { motion } from 'framer-motion'
import CommandCenter from './components/CommandCenter/CommandCenter'
import Canvas from './components/Canvas/Canvas'
import AssetLibrary from './components/AssetLibrary/AssetLibrary'
import { generateCreative, verifyAndCommit, getAssetUrl } from './utils/api'

function Studio() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [canvasState, setCanvasState] = useState(null)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [assets, setAssets] = useState([])
  const [verificationResult, setVerificationResult] = useState(null)

  const handleGenerate = async (prompt) => {
    setIsGenerating(true)
    setGenerationStage('generating')
    setImageBase64(null)
    setMetadata(null)
    setCanvasState(null)
    setAssets([])

    try {
      setGenerationStage('generating')
      const generateResponse = await generateCreative(prompt)
      
      console.log('[App] Generate response:', generateResponse)
      
      if (generateResponse.image_base64) {
        console.log('[App] Setting poster image, base64 length:', generateResponse.image_base64.length)
        const imageDataUrl = `data:image/png;base64,${generateResponse.image_base64}`
        console.log('[App] Image data URL:', imageDataUrl.substring(0, 50) + '...')
        setImageBase64(imageDataUrl)
      } else {
        console.warn('[App] No image_base64 in response')
      }
      
      if (generateResponse.assets && Array.isArray(generateResponse.assets)) {
        console.log('[App] Backend returned assets:', generateResponse.assets)
        const assetUrls = generateResponse.assets.map(assetPath => {
          const fullUrl = getAssetUrl(assetPath)
          console.log('[App] Mapped asset:', assetPath, '→', fullUrl)
          return { url: fullUrl }
        })
        console.log('[App] Final asset URLs:', assetUrls)
        setAssets(assetUrls)
        setGenerationStage('complete')
      } else {
        console.warn('[App] No assets returned from backend:', generateResponse)
        setAssets([])
      }
      
      if (generateResponse.toon) {
        setMetadata(generateResponse)
      }
      
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
      alert('No canvas state to verify. Please create a creative first.')
      return
    }

    try {
      const result = await verifyAndCommit(canvasState, metadata)
      setVerificationResult({
        hash: result.hash || 'N/A',
        block_id: result.block_id || 'N/A'
      })
      if (result.message) {
        alert(`Verification: ${result.message}`)
      } else {
        alert(`Verified successfully!\nHash: ${result.hash}\nBlock ID: ${result.block_id}`)
      }
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
      className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50"
    >
      <div className="absolute inset-0 bg-grid-enterprise opacity-5" />

      <div className="flex h-full gap-3 p-3 relative z-10">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-80 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-xl overflow-hidden shadow-lg"
        >
          <CommandCenter
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            generationStage={generationStage}
            onVerify={handleVerify}
            canvasState={canvasState}
            verificationResult={verificationResult}
          />
        </motion.div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex-1 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-xl overflow-hidden shadow-lg"
        >
          <Canvas
            imageBase64={imageBase64}
            onCanvasStateChange={setCanvasState}
            selectedAsset={selectedAsset}
            onAssetAdded={() => setSelectedAsset(null)}
          />
        </motion.div>

        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="w-80 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-xl overflow-hidden shadow-lg"
        >
          <AssetLibrary
            assets={assets}
            selectedAsset={selectedAsset}
            onAssetSelect={setSelectedAsset}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Studio
