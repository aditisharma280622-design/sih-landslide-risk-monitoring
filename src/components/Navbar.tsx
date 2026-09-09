import { forwardRef, useEffect, useState } from 'react'
import { Menu } from 'lucide-react'

const NAV_LINKS = ['PAHARI RAKSHAK', 'RISK MAP', 'ALERTS', 'FIELD REPORTS', 'ABOUT']

interface NavbarProps {
  onMenuOpen: () => void
}

/**
 * Root <nav> is exposed via ref so the scroll-driven rAF loop in App can
 * toggle its light/dark contrast directly on the DOM — that state changes
 * up to 60 times a second while scrolling and has no business going
 * through React state.
 */
const Navbar = forwardRef<HTMLElement, NavbarProps>(({ onMenuOpen }, ref) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <nav
      ref={ref}
      data-contrast="dark"
      className="pointer-events-auto fixed top-0 z-50 w-full px-6 pt-8 pb-6 sm:px-8 sm:pt-12 md:px-12 [&[data-contrast=light]]:text-white [&[data-contrast=dark]]:text-[#1d3045] transition-colors duration-500"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(-12px)',
        transition:
          'opacity 500ms cubic-bezier(0.16,1,0.3,1), transform 500ms cubic-bezier(0.16,1,0.3,1), color 500ms ease',
      }}
    >
      <div className="flex items-center justify-between">
        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((label, index) => (
            <li
              key={label}
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(-8px)',
                transition: `opacity 500ms cubic-bezier(0.16,1,0.3,1) ${index * 80}ms, transform 500ms cubic-bezier(0.16,1,0.3,1) ${index * 80}ms`,
              }}
            >
              <a
                href="#"
                className="border-b-2 border-transparent pb-1 text-xs font-medium tracking-[0.15em] uppercase transition-colors hover:border-current focus-visible:border-current focus-visible:outline-none"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-2 sm:flex" aria-hidden="true">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
            </span>
            <span className="text-xs font-medium tracking-[0.15em] uppercase">Live Status</span>
          </div>

          <button
            type="button"
            onClick={onMenuOpen}
            aria-label="Open menu"
            className="flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase lg:hidden"
          >
            <Menu size={20} strokeWidth={1.5} />
            <span className="sr-only">Menu</span>
          </button>

          <button
            type="button"
            onClick={onMenuOpen}
            className="hidden text-xs font-medium tracking-[0.15em] uppercase lg:block"
          >
            Menu
          </button>
        </div>
      </div>
    </nav>
  )
})

Navbar.displayName = 'Navbar'

export default Navbar
