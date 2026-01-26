/**
 * ShoppingCart - Pre-built Shopping Cart Component
 * 
 * Features:
 * - Item list with images
 * - Quantity adjustment
 * - Remove items
 * - Subtotal/total calculation
 * - Checkout button
 */

import { useState } from 'react'

interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
}

interface ShoppingCartProps {
  items?: CartItem[]
  onItemsChange?: (items: CartItem[]) => void
  onCheckout?: (items: CartItem[], total: number) => void
  shipping?: number
  tax?: number
}

const IconMinus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)

const IconCart = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
)

export default function ShoppingCart({ items: initialItems = [], onItemsChange, onCheckout, shipping = 0, tax = 0 }: ShoppingCartProps) {
  const [items, setItems] = useState<CartItem[]>(initialItems)

  const updateItems = (newItems: CartItem[]) => {
    setItems(newItems)
    onItemsChange?.(newItems)
  }

  const updateQuantity = (id: string, delta: number) => {
    updateItems(items.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const removeItem = (id: string) => {
    updateItems(items.filter(item => item.id !== id))
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxAmount = subtotal * tax
  const total = subtotal + shipping + taxAmount

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Shopping Cart {items.length > 0 && `(${items.reduce((sum, i) => sum + i.quantity, 0)})`}
        </h2>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="p-8 text-center">
          <div className="mb-4" style={{ color: 'var(--text-tertiary)' }}><IconCart /></div>
          <p style={{ color: 'var(--text-tertiary)' }}>Your cart is empty</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
          {items.map(item => (
            <div key={item.id} className="p-4 flex gap-4">
              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</h3>
                <p className="text-lg font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>${item.price}</p>
                
                <div className="flex items-center gap-3 mt-2">
                  {/* Quantity controls */}
                  <div className="flex items-center rounded-lg" style={{ border: '1px solid var(--border-primary)' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      <IconMinus />
                    </button>
                    <span className="px-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      <IconPlus />
                    </button>
                  </div>
                  
                  {/* Remove */}
                  <button onClick={() => removeItem(item.id)} className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                    <IconTrash />
                  </button>
                </div>
              </div>
              
              {/* Line total */}
              <div className="text-right">
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <div className="p-4" style={{ borderTop: '1px solid var(--border-primary)', background: 'var(--bg-primary)' }}>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span style={{ color: 'var(--text-primary)' }}>${subtotal.toFixed(2)}</span>
            </div>
            {shipping > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                <span style={{ color: 'var(--text-primary)' }}>${shipping.toFixed(2)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Tax ({(tax * 100).toFixed(0)}%)</span>
                <span style={{ color: 'var(--text-primary)' }}>${taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
              <span style={{ color: 'var(--text-primary)' }}>Total</span>
              <span style={{ color: 'var(--text-primary)' }}>${total.toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            onClick={() => onCheckout?.(items, total)}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  )
}
