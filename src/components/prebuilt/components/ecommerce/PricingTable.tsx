/**
 * PricingTable - Pre-built Pricing Plans Component
 * 
 * Features:
 * - Multiple plan tiers
 * - Feature lists with checkmarks
 * - Popular/recommended highlight
 * - Monthly/annual toggle
 * - CTA buttons
 */

import { useState } from 'react'

interface PricingPlan {
  id: string
  name: string
  description?: string
  monthlyPrice: number
  annualPrice: number
  features: string[]
  highlighted?: boolean
  cta?: string
}

interface PricingTableProps {
  plans: PricingPlan[]
  onSelectPlan?: (plan: PricingPlan, isAnnual: boolean) => void
  showToggle?: boolean
}

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function PricingTable({ plans, onSelectPlan, showToggle = true }: PricingTableProps) {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <div>
      {/* Billing toggle */}
      {showToggle && (
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : ''}`} style={{ color: isAnnual ? 'var(--text-tertiary)' : undefined }}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative w-14 h-7 rounded-full transition-colors"
            style={{ background: isAnnual ? '#3b82f6' : 'var(--bg-primary)' }}
          >
            <span 
              className="absolute top-1 w-5 h-5 rounded-full bg-white transition-transform"
              style={{ left: isAnnual ? '32px' : '4px' }}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-white' : ''}`} style={{ color: !isAnnual ? 'var(--text-tertiary)' : undefined }}>
            Annual <span className="text-green-400 text-xs ml-1">Save 20%</span>
          </span>
        </div>
      )}

      {/* Plans grid */}
      <div className={`grid gap-6 ${plans.length === 3 ? 'md:grid-cols-3' : plans.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-4'}`}>
        {plans.map(plan => {
          const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
          
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 ${plan.highlighted ? 'ring-2 ring-blue-500' : ''}`}
              style={{ 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border-primary)',
                transform: plan.highlighted ? 'scale(1.05)' : undefined
              }}
            >
              {/* Popular badge */}
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}

              {/* Plan name */}
              <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
              {plan.description && (
                <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>{plan.description}</p>
              )}

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>${price}</span>
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>/{isAnnual ? 'year' : 'month'}</span>
              </div>

              {/* CTA */}
              <button
                onClick={() => onSelectPlan?.(plan, isAnnual)}
                className={`w-full py-3 rounded-xl font-medium transition-colors mb-6 ${
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
                style={{ color: plan.highlighted ? undefined : 'var(--text-primary)' }}
              >
                {plan.cta || 'Get Started'}
              </button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="text-green-400 flex-shrink-0"><IconCheck /></span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
