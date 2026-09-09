import { forwardRef } from 'react'
import { ArrowRight } from 'lucide-react'

const FACTORS = ['Population', 'Infrastructure', 'Road Connectivity', 'Hospital Access']

interface ImpactSectionProps {
  onEnterDashboard: () => void
}

/**
 * Scene 3, the product's core differentiator: ranking by expected human
 * and infrastructure impact, not raw landslide probability. Sits over the
 * darkest video frames, so type flips to white.
 */
const ImpactSection = forwardRef<HTMLDivElement, ImpactSectionProps>(({ onEnterDashboard }, ref) => {
  return (
    <div
      ref={ref}
      data-active="false"
      className="pointer-events-auto absolute inset-0 flex items-center justify-end px-6 text-right text-white sm:px-8 md:px-20 lg:px-32"
      style={{ transition: 'opacity 0.1s ease-out' }}
    >
      <div style={{ maxWidth: '650px' }}>
        <p
          className="reveal text-sm tracking-[0.2em] text-white/60 uppercase"
          style={{ '--reveal-delay': '0ms' } as React.CSSProperties}
        >
          Impact-Weighted Priority Engine
        </p>

        <h2
          className="reveal mt-6 font-light tracking-wide uppercase leading-[1.2]"
          style={{ fontSize: 'clamp(2rem, 4vw, 4rem)', '--reveal-delay': '150ms' } as React.CSSProperties}
        >
          Risk is only part
          <br />
          of the story.
        </h2>

        <p
          className="reveal mt-6 ml-auto max-w-md text-base text-white/80 sm:text-lg"
          style={{ '--reveal-delay': '300ms' } as React.CSSProperties}
        >
          We prioritize the places where failure would have the greatest human and
          infrastructure impact.
        </p>

        <ul
          className="reveal mt-8 flex flex-wrap justify-end gap-x-6 gap-y-2 text-xs tracking-[0.15em] text-white/70 uppercase"
          style={{ '--reveal-delay': '450ms' } as React.CSSProperties}
        >
          {FACTORS.map((factor) => (
            <li key={factor}>{factor}</li>
          ))}
        </ul>

        <div
          className="reveal mt-10 flex items-center justify-end gap-4"
          style={{ '--reveal-delay': '600ms' } as React.CSSProperties}
        >
          <span className="text-xs font-medium tracking-[0.2em] uppercase">
            Enter Risk Monitoring
          </span>
          <button
            type="button"
            onClick={onEnterDashboard}
            aria-label="Enter risk monitoring"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800 transition-transform hover:scale-110"
          >
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
})

ImpactSection.displayName = 'ImpactSection'

export default ImpactSection
