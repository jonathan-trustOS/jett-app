/**
 * Chart - Pre-built Simple Chart Component
 * 
 * Features:
 * - Line and bar charts
 * - Responsive sizing
 * - Tooltips on hover
 * - Animated
 */

import { useState } from 'react'

interface DataPoint {
  label: string
  value: number
}

interface ChartProps {
  data: DataPoint[]
  type?: 'line' | 'bar'
  height?: number
  color?: string
  showLabels?: boolean
  showGrid?: boolean
}

export default function Chart({ data, type = 'line', height = 200, color = '#3b82f6', showLabels = true, showGrid = true }: ChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl" style={{ height, background: 'var(--bg-secondary)' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>No data</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1
  
  const padding = { top: 20, right: 20, bottom: showLabels ? 40 : 20, left: 40 }
  const chartWidth = 100 // percentage
  const chartHeight = height - padding.top - padding.bottom

  const getY = (value: number) => {
    return chartHeight - ((value - minValue) / range) * chartHeight
  }

  // Generate line path
  const linePath = data.map((point, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = getY(point.value)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  // Generate area path (for fill under line)
  const areaPath = `${linePath} L 100 ${chartHeight} L 0 ${chartHeight} Z`

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
      <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
        {/* Grid lines */}
        {showGrid && (
          <g>
            {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
              const y = padding.top + chartHeight * (1 - tick)
              return (
                <line key={i} x1={0} y1={y} x2={100} y2={y} stroke="var(--border-primary)" strokeDasharray="2" />
              )
            })}
          </g>
        )}

        {/* Chart area offset */}
        <g transform={`translate(0, ${padding.top})`}>
          {type === 'line' ? (
            <>
              {/* Area fill */}
              <path d={areaPath} fill={color} fillOpacity={0.1} />
              {/* Line */}
              <path d={linePath} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
              {/* Data points */}
              {data.map((point, i) => {
                const x = (i / (data.length - 1)) * 100
                const y = getY(point.value)
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={hoveredIndex === i ? 5 : 3}
                    fill={color}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{ cursor: 'pointer', transition: 'r 0.2s' }}
                  />
                )
              })}
            </>
          ) : (
            /* Bar chart */
            data.map((point, i) => {
              const barWidth = 80 / data.length
              const x = (i / data.length) * 100 + (10 / data.length)
              const barHeight = ((point.value - minValue) / range) * chartHeight
              const y = chartHeight - barHeight
              return (
                <rect
                  key={i}
                  x={`${x}%`}
                  y={y}
                  width={`${barWidth}%`}
                  height={barHeight}
                  fill={hoveredIndex === i ? color : `${color}cc`}
                  rx={2}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
                />
              )
            })
          )}
        </g>
      </svg>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between mt-2 px-1">
          {data.map((point, i) => (
            <span key={i} className="text-xs truncate" style={{ color: 'var(--text-tertiary)', maxWidth: `${100 / data.length}%` }}>
              {point.label}
            </span>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div className="mt-2 text-center">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {data[hoveredIndex].label}: {data[hoveredIndex].value}
          </span>
        </div>
      )}
    </div>
  )
}
