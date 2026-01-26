/**
 * StatsCard - Pre-built Statistics Card Component
 * 
 * Features:
 * - Value with label
 * - Trend indicator
 * - Icon support
 * - Compact variant
 */

interface StatsCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: { value: number; label?: string }
  variant?: 'default' | 'compact'
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
}

const IconTrendUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
)

const IconTrendDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
)

const colorMap = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' }
}

export default function StatsCard({ label, value, icon, trend, variant = 'default', color = 'blue' }: StatsCardProps) {
  const colors = colorMap[color]
  const isPositive = trend && trend.value >= 0

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
        {icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg} ${colors.text}`}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <IconTrendUp /> : <IconTrendDown />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        {icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg} ${colors.text}`}>
            {icon}
          </div>
        )}
      </div>
      
      <p className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{value}</p>
      
      {trend && (
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <IconTrendUp /> : <IconTrendDown />}
            {Math.abs(trend.value)}%
          </span>
          {trend.label && (
            <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{trend.label}</span>
          )}
        </div>
      )}
    </div>
  )
}
