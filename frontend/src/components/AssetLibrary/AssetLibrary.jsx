import { motion } from 'framer-motion'
import { useState } from 'react'
import { getAssetUrl } from '../../utils/api'

function AssetThumbnail({ asset, isSelected, onSelect }) {
  const assetUrl = asset.url || asset.path || null
  const fullUrl = assetUrl 
    ? (assetUrl.startsWith('http://') || assetUrl.startsWith('https://') 
        ? assetUrl 
        : getAssetUrl(assetUrl))
    : null
  
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(asset)}
      className={`relative cursor-move bg-white border border-slate-300 rounded-xl overflow-hidden transition-all shadow-sm ${
        isSelected ? 'border-retail-cyan' : 'border-muted-gray/20 hover:border-muted-gray/40'
      }`}
    >
      {fullUrl && !imageError ? (
        <img
          src={fullUrl}
          alt="Asset"
          className="w-full h-full object-contain"
          style={{ imageRendering: 'high-quality' }}
          onLoad={() => {
            setImageLoading(false)
          }}
          onError={(e) => {
            console.error('[AssetLibrary] Image load error:', fullUrl)
            setImageError(true)
            setImageLoading(false)
          }}
        />
      ) : imageError ? (
        <div className="w-full h-32 flex items-center justify-center text-muted-gray text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
          Failed to load
        </div>
      ) : (
        <div className="w-full h-32 flex items-center justify-center text-muted-gray text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
          Loading...
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-2 py-1.5">
        <p className="text-xs text-slate-700 text-center truncate" style={{ fontFamily: 'Inter, sans-serif' }}>Product Asset</p>
      </div>
      <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm border border-slate-300 rounded-lg p-1.5 shadow-sm">
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-slate-700"
        >
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </div>
      {isSelected && (
        <div className="absolute top-2 left-2 bg-retail-cyan text-white rounded-full p-1 shadow-sm">
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </motion.div>
  )
}

export default function AssetLibrary({ assets, selectedAsset, onAssetSelect }) {
  return (
    <div className="h-full flex flex-col bg-white/80 backdrop-blur-xl">
      <div className="p-4 border-b border-slate-200/60">
        <h2 className="text-sm font-semibold text-slate-800 mb-1 tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>Asset Library</h2>
        <p className="text-xs text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>{assets.length} assets available</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {assets.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            No assets available. Generate a creative to load products.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {assets.map((asset, idx) => (
              <AssetThumbnail
                key={idx}
                asset={typeof asset === 'string' ? { url: asset } : asset}
                isSelected={selectedAsset?.url === (typeof asset === 'string' ? asset : asset.url)}
                onSelect={onAssetSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
