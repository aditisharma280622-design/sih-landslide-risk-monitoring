const ITEMS = [
  { label: 'Critical', className: 'bg-red-600' },
  { label: 'High', className: 'bg-orange-500' },
  { label: 'Moderate', className: 'bg-amber-400' },
  { label: 'Low', className: 'bg-emerald-500' },
  { label: 'Historical', className: 'bg-[#1d3045]/40' },
  { label: 'Field Report', className: 'bg-sky-500' },
]

export default function RiskLegend() {
  return (
    <div
      className="pointer-events-auto absolute bottom-3 left-3 z-[400] rounded-md border border-[#1d3045]/10 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm"
      aria-label="Map legend"
    >
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {ITEMS.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5 text-[11px] text-[#1d3045]/70">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.className}`} aria-hidden="true" />
            <span className="tracking-[0.04em] uppercase">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
