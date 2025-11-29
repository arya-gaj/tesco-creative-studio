export default function NoiseOverlay() {
  const noiseSvg = `data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E`

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] mix-blend-overlay"
      style={{
        backgroundImage: `url("${noiseSvg}")`,
        backgroundSize: '200px 200px',
        imageRendering: 'pixelated'
      }}
    />
  )
}
