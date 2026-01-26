/**
 * ProductCard - Pre-built Product Display Component
 * 
 * Features:
 * - Product image with hover effects
 * - Price display (with sale price)
 * - Add to cart button
 * - Quick view option
 * - Rating display
 */

import { useState } from 'react'

interface Product {
  id: string
  name: string
  price: number
  salePrice?: number
  image: string
  rating?: number
  reviews?: number
  inStock?: boolean
  badge?: string
}

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  onQuickView?: (product: Product) => void
  variant?: 'default' | 'compact'
}

const IconCart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
)

const IconStar = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)

export default function ProductCard({ product, onAddToCart, onQuickView, variant = 'default' }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const discount = product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-600'}>
        <IconStar filled={i < Math.floor(rating)} />
      </span>
    ))
  }

  if (variant === 'compact') {
    return (
      <div className="flex gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
        <img src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {product.salePrice ? (
              <>
                <span className="font-semibold text-green-400">${product.salePrice}</span>
                <span className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>${product.price}</span>
              </>
            ) : (
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>${product.price}</span>
            )}
          </div>
        </div>
        <button onClick={() => onAddToCart?.(product)} className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white self-center">
          <IconCart />
        </button>
      </div>
    )
  }

  return (
    <div 
      className="rounded-2xl overflow-hidden group"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        {/* Badge */}
        {product.badge && (
          <span className="absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded-full bg-blue-600 text-white">
            {product.badge}
          </span>
        )}
        
        {/* Sale badge */}
        {discount > 0 && (
          <span className="absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full bg-red-500 text-white">
            -{discount}%
          </span>
        )}

        {/* Hover actions */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={() => onAddToCart?.(product)}
            className="p-3 rounded-full bg-white text-gray-900 hover:bg-blue-500 hover:text-white transition-colors"
          >
            <IconCart />
          </button>
          {onQuickView && (
            <button 
              onClick={() => onQuickView(product)}
              className="p-3 rounded-full bg-white text-gray-900 hover:bg-blue-500 hover:text-white transition-colors"
            >
              <IconEye />
            </button>
          )}
        </div>

        {/* Out of stock overlay */}
        {product.inStock === false && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="px-4 py-2 bg-gray-800 text-white rounded-full text-sm">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium mb-1 truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
        
        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">{renderStars(product.rating)}</div>
            {product.reviews && (
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>({product.reviews})</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          {product.salePrice ? (
            <>
              <span className="text-lg font-bold text-green-400">${product.salePrice}</span>
              <span className="text-sm line-through" style={{ color: 'var(--text-tertiary)' }}>${product.price}</span>
            </>
          ) : (
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>${product.price}</span>
          )}
        </div>
      </div>
    </div>
  )
}
