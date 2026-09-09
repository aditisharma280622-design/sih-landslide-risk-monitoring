import type { Trend } from '@/types/risk'
import { buildPlaceholderSeries } from '@/utils/riskSimulation'

interface RiskTrendProps {
  zoneId: string
  currentScore: number
  trend: Trend
  /**
   * Optional explicit history (oldest → newest, last entry is "now").
   * When the live simulation panel is driving a zone, it supplies this
   * directly so the chart reflects actual scenario transitions instead
   * of the deterministic placeholder walk below.
   */
  series?: number[]
}

export default function RiskTrend({ zoneId, currentScore, trend, series: explicitSeries }: RiskTrendProps) {
  const series = explicitSeries ?? buildPlaceholderSeries(zoneId, currentScore, trend)
  const width = 200
  const height = 48
  const max = 100
  const min = 0
  const stepX = series.length > 1 ? width / (series.length - 1) : 0

  const coords = series.map((value, index) => ({
    x: index * stepX,
    y: height - ((value - min) / (max - min)) * height,
  }))
  const points = coords.map((p) => `${p.x},${p.y}`).join(' ')
  const last = coords[coords.length - 1]

  const areaPoints = `0,${height} ${points} ${width},${height}`
  const strokeColor = trend === 'increasing' ? '#dc2626' : trend === 'decreasing' ? '#059669' : '#1d3045'

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-12 w-full overflow-visible"
      role="img"
      aria-label={`Risk score trend, currently ${trend}, latest reading ${currentScore}%`}
      preserveAspectRatio="none"
    >
      <polyline points={areaPoints} fill={`${strokeColor}14`} stroke="none" />
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ transition: 'points 400ms ease-out' }}
      />
      {last && (
        <circle
          key={`${currentScore}-${series.length}`}
          cx={last.x}
          cy={last.y}
          r={3.5}
          fill={strokeColor}
          style={{ transformOrigin: `${last.x}px ${last.y}px`, animation: 'risk-trend-pop 500ms ease-out' }}
        />
      )}
      <style>{`
        @keyframes risk-trend-pop {
          0% { r: 3.5; opacity: 0.4; }
          60% { r: 7; opacity: 1; }
          100% { r: 3.5; opacity: 1; }
        }
      `}</style>
    </svg>
  )
}
