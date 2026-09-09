import { useEffect } from 'react'
import { X } from 'lucide-react'

const MENU_LINKS = ['PAHARI RAKSHAK', 'RISK MAP', 'ALERTS', 'FIELD REPORTS', 'ABOUT']

interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      aria-hidden={!open}
      className="fixed inset-0 z-[100] flex flex-col bg-[#1d3045]"
      style={{
        opacity: open ? 1 : 0,
        visibility: open ? 'visible' : 'hidden',
        transition: 'opacity 500ms cubic-bezier(0.4,0,0.2,1), visibility 500ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        className="absolute top-8 right-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-transform hover:scale-105 sm:right-8"
      >
        <X size={18} strokeWidth={1.5} />
      </button>

      <ul className="m-auto flex flex-col items-center gap-6 px-6 text-center">
        {MENU_LINKS.map((label, index) => (
          <li
            key={label}
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 500ms cubic-bezier(0.16,1,0.3,1) ${open ? index * 60 : 0}ms, transform 500ms cubic-bezier(0.16,1,0.3,1) ${open ? index * 60 : 0}ms`,
            }}
          >
            <a
              href="#"
              onClick={onClose}
              className={`font-light tracking-wide uppercase text-2xl sm:text-3xl transition-colors ${
                index === 0 ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between px-6 pb-8 text-xs tracking-[0.2em] text-white/60 uppercase sm:px-8">
        <span>Live Status</span>
        <span>Contact</span>
      </div>
    </div>
  )
}
