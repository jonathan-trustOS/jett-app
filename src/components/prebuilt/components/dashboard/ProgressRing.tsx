/**
 * ProgressRing - Pre-built Circular Progress Component
 * 
 * Features:
 * - Animated progress
 * - Customizable colors
 * - Center content
 * - Multiple sizes
 */

interface ProgressRingProps {
  progress: number // 0-100
  size?: 'sm' | 'md' | 'lg' | number
  strokeWidth?: number
  color?: string
  trackColor?: string
  children?: React.ReactNode
  showPercent?: boolean
  animated?: boolean
}

export default function ProgressRing({
  progress,
  size = 'md',
  strokeWidth = 8,
  color = '#3b82f6',
  trackColor,
  children,
  showPercent = true,
  animated = true
}: ProgressRingProps) {
  const sizeMap = { sm: 64, md: 96, lg: 128 }
  const actualSize = typeof size === 'number' ? size : sizeMap[size]
  
  const radius = (actualSize - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: actualSize, height: actualSize }}>
      <svg width={actualSize} height={actualSize} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={radius}
          fill="none"
          stroke={trackColor || 'var(--border-primary)'}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: animated ? 'stroke-dashoffset 0.5s ease-out' : undefined
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showPercent && (
          <span 
            className="font-semibold" 
            style={{ 
              color: 'var(--text-primary)',
              fontSize: actualSize < 80 ? '0.875rem' : actualSize < 120 ? '1.25rem' : '1.5rem'
            }}
          >
            {Math.round(progress)}%
          </span>
        ))}
      </div>
    </div>
  )
}
