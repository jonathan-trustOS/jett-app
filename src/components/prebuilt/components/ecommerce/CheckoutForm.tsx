/**
 * CheckoutForm - Pre-built Checkout Form Component
 * 
 * Features:
 * - Contact info
 * - Shipping address
 * - Payment method selection
 * - Form validation
 * - Order summary
 */

import { useState } from 'react'

interface CheckoutData {
  email: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  paymentMethod: 'card' | 'paypal'
  cardNumber?: string
  cardExpiry?: string
  cardCvc?: string
}

interface CheckoutFormProps {
  total: number
  onSubmit?: (data: CheckoutData) => void
  onCancel?: () => void
}

const IconCreditCard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
)

const IconPaypal = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.144 19.532l1.049-5.751c.085-.474.273-.633.597-.633h4.011c3.085 0 5.496-1.297 6.16-5.045.056-.315.092-.609.113-.889-.372-.197-.776-.353-1.209-.469C16.98 6.495 15.87 6.33 14.6 6.33H8.155c-.34 0-.63.247-.689.581L5.28 19.089a.412.412 0 00.409.477h1.455z"/>
  </svg>
)

export default function CheckoutForm({ total, onSubmit, onCancel }: CheckoutFormProps) {
  const [data, setData] = useState<CheckoutData>({
    email: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    paymentMethod: 'card'
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutData, string>>>({})

  const update = (field: keyof CheckoutData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CheckoutData, string>> = {}
    if (!data.email.includes('@')) newErrors.email = 'Valid email required'
    if (!data.name) newErrors.name = 'Name required'
    if (!data.address) newErrors.address = 'Address required'
    if (!data.city) newErrors.city = 'City required'
    if (!data.zip) newErrors.zip = 'ZIP code required'
    if (data.paymentMethod === 'card') {
      if (!data.cardNumber || data.cardNumber.length < 16) newErrors.cardNumber = 'Valid card number required'
      if (!data.cardExpiry) newErrors.cardExpiry = 'Expiry required'
      if (!data.cardCvc || data.cardCvc.length < 3) newErrors.cardCvc = 'CVC required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) onSubmit?.(data)
  }

  const inputClass = "w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
  const inputStyle = { background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
        {/* Contact */}
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Contact</h3>
        <div className="mb-4">
          <input type="email" placeholder="Email" value={data.email} onChange={e => update('email', e.target.value)} className={inputClass} style={inputStyle} />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Shipping */}
        <h3 className="text-lg font-semibold mb-4 mt-6" style={{ color: 'var(--text-primary)' }}>Shipping Address</h3>
        <div className="space-y-4">
          <div>
            <input type="text" placeholder="Full name" value={data.name} onChange={e => update('name', e.target.value)} className={inputClass} style={inputStyle} />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <input type="text" placeholder="Address" value={data.address} onChange={e => update('address', e.target.value)} className={inputClass} style={inputStyle} />
            {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input type="text" placeholder="City" value={data.city} onChange={e => update('city', e.target.value)} className={inputClass} style={inputStyle} />
              {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
            </div>
            <input type="text" placeholder="State" value={data.state} onChange={e => update('state', e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input type="text" placeholder="ZIP code" value={data.zip} onChange={e => update('zip', e.target.value)} className={inputClass} style={inputStyle} />
              {errors.zip && <p className="text-red-400 text-xs mt-1">{errors.zip}</p>}
            </div>
            <select value={data.country} onChange={e => update('country', e.target.value)} className={inputClass} style={inputStyle}>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
              <option value="AU">Australia</option>
            </select>
          </div>
        </div>

        {/* Payment */}
        <h3 className="text-lg font-semibold mb-4 mt-6" style={{ color: 'var(--text-primary)' }}>Payment</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            type="button"
            onClick={() => update('paymentMethod', 'card')}
            className={`flex items-center justify-center gap-2 p-4 rounded-lg transition-colors ${data.paymentMethod === 'card' ? 'ring-2 ring-blue-500' : ''}`}
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
          >
            <IconCreditCard /> Card
          </button>
          <button
            type="button"
            onClick={() => update('paymentMethod', 'paypal')}
            className={`flex items-center justify-center gap-2 p-4 rounded-lg transition-colors ${data.paymentMethod === 'paypal' ? 'ring-2 ring-blue-500' : ''}`}
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
          >
            <IconPaypal /> PayPal
          </button>
        </div>

        {data.paymentMethod === 'card' && (
          <div className="space-y-4">
            <div>
              <input type="text" placeholder="Card number" value={data.cardNumber || ''} onChange={e => update('cardNumber', e.target.value.replace(/\D/g, '').slice(0, 16))} className={inputClass} style={inputStyle} />
              {errors.cardNumber && <p className="text-red-400 text-xs mt-1">{errors.cardNumber}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input type="text" placeholder="MM/YY" value={data.cardExpiry || ''} onChange={e => update('cardExpiry', e.target.value)} className={inputClass} style={inputStyle} />
                {errors.cardExpiry && <p className="text-red-400 text-xs mt-1">{errors.cardExpiry}</p>}
              </div>
              <div>
                <input type="text" placeholder="CVC" value={data.cardCvc || ''} onChange={e => update('cardCvc', e.target.value.replace(/\D/g, '').slice(0, 4))} className={inputClass} style={inputStyle} />
                {errors.cardCvc && <p className="text-red-400 text-xs mt-1">{errors.cardCvc}</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order summary */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
        <div className="flex justify-between text-lg font-bold">
          <span style={{ color: 'var(--text-primary)' }}>Total</span>
          <span style={{ color: 'var(--text-primary)' }}>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl font-medium" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
            Cancel
          </button>
        )}
        <button type="submit" className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
          Pay ${total.toFixed(2)}
        </button>
      </div>
    </form>
  )
}
