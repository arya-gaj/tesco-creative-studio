import { motion } from 'framer-motion'
import useImage from 'use-image'

function AssetThumbnail({ asset, isSelected, onSelect }) {
  const [image] = useImage(asset.url || asset.path || null)

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(asset)}
      className={`relative cursor-pointer bg-white border rounded-md overflow-hidden transition-all ${
        isSelected ? 'border-[#ec6608]' : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      {image ? (
        <img
          src={image.src}
          alt="Asset"
          className="w-full h-full object-contain"
          style={{ imageRendering: 'high-quality' }}
        />
      ) : (
        <div className="w-full h-32 flex items-center justify-center text-slate-400 text-xs" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
          Loading...
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-300 px-2 py-1">
        <p className="text-xs text-[#2d373c] text-center truncate" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>Product</p>
      </div>
    </motion.div>
  )
}

export default function AssetLibrary({ assets, selectedAsset, onAssetSelect }) {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-3 border-b border-slate-300 rounded-t-md">
        <h2 className="text-base font-bold text-[#003349] uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>ASSET LIBRARY</h2>
        <p className="text-xs text-[#2d373c] mt-0.5" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>{assets.length} assets</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {assets.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-8" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
            No assets available. Generate a creative to load products.
          </div>
        ) : (
          assets.map((asset, idx) => (
            <AssetThumbnail
              key={idx}
              asset={typeof asset === 'string' ? { url: asset } : asset}
              isSelected={selectedAsset?.url === (typeof asset === 'string' ? asset : asset.url)}
              onSelect={onAssetSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
