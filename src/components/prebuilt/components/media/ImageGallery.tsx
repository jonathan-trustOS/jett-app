/**
 * ImageGallery - Pre-built Image Gallery Component
 * 
 * Features:
 * - Grid layout
 * - Lightbox view
 * - Navigation arrows
 * - Keyboard navigation
 */

import { useState, useEffect } from 'react'

interface Image {
  id: string
  src: string
  alt?: string
  thumbnail?: string
}

interface ImageGalleryProps {
  images: Image[]
  columns?: 2 | 3 | 4
  gap?: number
  onImageClick?: (image: Image, index: number) => void
  showLightbox?: boolean
}

const IconX = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconChevronLeft = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const IconChevronRight = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

export default function ImageGallery({ images, columns = 3, gap = 4, onImageClick, showLightbox = true }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openLightbox = (index: number) => {
    if (showLightbox) setLightboxIndex(index)
    onImageClick?.(images[index], index)
  }

  const closeLightbox = () => setLightboxIndex(null)
  const goToPrev = () => lightboxIndex !== null && setLightboxIndex(lightboxIndex === 0 ? images.length - 1 : lightboxIndex - 1)
  const goToNext = () => lightboxIndex !== null && setLightboxIndex(lightboxIndex === images.length - 1 ? 0 : lightboxIndex + 1)

  useEffect(() => {
    if (lightboxIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex])

  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex])

  const gridCols = columns === 2 ? 'grid-cols-2' : columns === 4 ? 'grid-cols-4' : 'grid-cols-3'

  return (
    <>
      <div className={`grid ${gridCols}`} style={{ gap: `${gap * 4}px` }}>
        {images.map((image, index) => (
          <div key={image.id} onClick={() => openLightbox(index)} className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group" style={{ background: 'var(--bg-secondary)' }}>
            <img src={image.thumbnail || image.src} alt={image.alt || ''} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button onClick={closeLightbox} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"><IconX /></button>
          {images.length > 1 && (
            <>
              <button onClick={goToPrev} className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"><IconChevronLeft /></button>
              <button onClick={goToNext} className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"><IconChevronRight /></button>
            </>
          )}
          <img src={images[lightboxIndex].src} alt={images[lightboxIndex].alt || ''} className="max-w-[90vw] max-h-[90vh] object-contain" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm">{lightboxIndex + 1} / {images.length}</div>
          <div className="absolute inset-0 -z-10" onClick={closeLightbox} />
        </div>
      )}
    </>
  )
}
