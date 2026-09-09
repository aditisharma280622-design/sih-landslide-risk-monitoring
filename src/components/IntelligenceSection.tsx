import { forwardRef } from 'react'
import { ArrowDown, ChevronUp } from 'lucide-react'

/** Scene 2: how the system reasons — rainfall, soil, terrain, history. */
const IntelligenceSection = forwardRef<HTMLDivElement>((_props, ref) => {
  return (
    <div
      ref={ref}
      data-active="false"
      className="pointer-events-auto absolute inset-0 flex items-center justify-center px-6 text-center text-[#1d3045] sm:px-8"
      style={{ transition: 'opacity 0.1s ease-out' }}
    >
      <div className="mx-auto" style={{ maxWidth: '900px' }}>
        <h2
          className="reveal font-light uppercase leading-[1.2]"
          style={{ fontSize: 'clamp(2rem, 4.5vw, 4.5rem)', '--reveal-delay': '0ms' } as React.CSSProperties}
        >
          Every slope tells a story.
        </h2>

        <p
          className="reveal mx-auto mt-6 max-w-2xl text-base text-[#1d3045cc] sm:text-lg"
          style={{ '--reveal-delay': '150ms' } as React.CSSProperties}
        >
          We combine rainfall, soil moisture, terrain, satellite intelligence and historical
          landslide records to understand risk before disaster strikes.
        </p>
      </div>

      <div className="absolute right-6 bottom-8 flex flex-col items-center gap-5 sm:right-8 sm:bottom-10 md:right-20">
        <a
          href="#impact"
          aria-label="Scroll to learn about impact-weighted priority"
          className="reveal flex h-12 w-12 items-center justify-center rounded-full border border-[#1d304580] transition-opacity hover:opacity-70"
          style={{ '--reveal-delay': '300ms' } as React.CSSProperties}
        >
          <ArrowDown size={18} strokeWidth={1.5} />
        </a>

        <div
          className="reveal flex flex-col items-center gap-2"
          style={{ '--reveal-delay': '450ms' } as React.CSSProperties}
          aria-hidden="true"
        >
          <span className="h-2 w-2 rounded-full bg-[#1d3045]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#1d304566]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#1d304566]" />
        </div>

        <a
          href="#hero"
          aria-label="Scroll back to the top"
          className="reveal flex h-10 w-10 items-center justify-center rounded-full border border-[#1d304580] transition-opacity hover:opacity-70"
          style={{ '--reveal-delay': '550ms' } as React.CSSProperties}
        >
          <ChevronUp size={16} strokeWidth={1.5} />
        </a>
      </div>
    </div>
  )
})

IntelligenceSection.displayName = 'IntelligenceSection'

export default IntelligenceSection
