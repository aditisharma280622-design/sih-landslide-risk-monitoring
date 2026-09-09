import { forwardRef } from 'react'
import { ArrowRight } from 'lucide-react'

/**
 * Scene 1 of the product story: "protect lives before the slope gives
 * way." Sits over bright aerial-mountain frames, so type uses the navy
 * brand color rather than white.
 */
const HeroSection = forwardRef<HTMLDivElement>((_props, ref) => {
  return (
    <div
      ref={ref}
      data-active="false"
      className="pointer-events-auto absolute inset-0 flex items-center px-6 text-[#1d3045] sm:px-8 md:px-20 lg:px-32"
      style={{ transition: 'opacity 0.1s ease-out' }}
    >
      <div>
        <p className="reveal text-sm tracking-[0.3em] uppercase" style={{ '--reveal-delay': '0ms' } as React.CSSProperties}>
          AI-Powered Early Warning
        </p>

        <h1
          className="reveal mt-6 font-light uppercase leading-[1.2]"
          style={
            {
              fontSize: 'clamp(2rem, 5vw, 5rem)',
              '--reveal-delay': '0ms',
            } as React.CSSProperties
          }
        >
          Protecting lives before
          <br />
          the slope gives way.
        </h1>

        <p
          className="reveal mt-6 max-w-md text-sm tracking-[0.3em] text-[#1d304590] uppercase"
          style={{ '--reveal-delay': '150ms' } as React.CSSProperties}
        >
          AI-powered landslide intelligence for the North Eastern Region
        </p>

        <div className="reveal mt-10" style={{ '--reveal-delay': '300ms' } as React.CSSProperties}>
          <a
            href="#intelligence"
            aria-label="Scroll to learn how PahariRakshak works"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[#1d304580] transition-opacity hover:opacity-70"
          >
            <ArrowRight size={18} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </div>
  )
})

HeroSection.displayName = 'HeroSection'

export default HeroSection
