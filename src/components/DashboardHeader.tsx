import { ArrowLeft, Settings } from 'lucide-react'

interface DashboardHeaderProps {
  onNavigate: (section: 'map' | 'alerts' | 'reports' | 'history') => void
  onExitToLanding: () => void
}

const NAV_ITEMS: { id: 'map' | 'alerts' | 'reports' | 'history'; label: string }[] = [
  { id: 'map', label: 'Risk Map' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'reports', label: 'Field Reports' },
  { id: 'history', label: 'History' },
]

export default function DashboardHeader({ onNavigate, onExitToLanding }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#1d3045]/10 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onExitToLanding}
          className="group flex items-center gap-2 text-left"
          aria-label="Exit to the PahariRakshak cinematic landing page"
        >
          <ArrowLeft
            size={15}
            strokeWidth={1.5}
            className="text-[#1d3045]/40 transition-transform group-hover:-translate-x-0.5 group-hover:text-[#1d3045]"
          />
          <span>
            <span className="block text-sm font-medium tracking-[0.1em] text-[#1d3045] uppercase">
              Pahari Rakshak
            </span>
            <span className="block text-[10px] tracking-[0.14em] text-[#1d3045]/50 uppercase">
              AI Landslide Intelligence
            </span>
          </span>
        </button>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Command center sections">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="border-b-2 border-transparent pb-1 text-xs font-medium tracking-[0.12em] text-[#1d3045]/70 uppercase transition-colors hover:border-[#1d3045] hover:text-[#1d3045]"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium tracking-[0.1em] text-[#1d3045]/70 uppercase">Live</span>
          </div>
          <button
            type="button"
            aria-label="Settings"
            className="rounded-full p-1.5 text-[#1d3045]/60 transition-colors hover:bg-[#1d3045]/5 hover:text-[#1d3045]"
          >
            <Settings size={17} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Mobile nav — horizontally scrollable since there's no hamburger overlay here */}
      <nav
        className="flex gap-4 overflow-x-auto border-t border-[#1d3045]/10 px-4 py-2 lg:hidden"
        aria-label="Command center sections"
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className="shrink-0 text-xs font-medium tracking-[0.1em] text-[#1d3045]/70 uppercase"
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
