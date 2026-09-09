import { useEffect, useRef, useState } from 'react'
import Navbar from '@/components/Navbar'
import MobileMenu from '@/components/MobileMenu'
import HeroSection from '@/components/HeroSection'
import IntelligenceSection from '@/components/IntelligenceSection'
import ImpactSection from '@/components/ImpactSection'
import { useVideoScrub } from '@/hooks/useVideoScrub'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260821_114821_a8ca298f-be2c-4613-a4dd-51b69e16bbde.mp4'

const REVEAL_THRESHOLD = 0.3
const NAVBAR_FLIP = 0.55

/** Section 16's exact opacity curves — one function per scene. */
function section1Opacity(p: number): number {
  if (p < 0.2) return 1
  return Math.max(0, 1 - (p - 0.2) / 0.08)
}

function section2Opacity(p: number): number {
  if (p < 0.32) return 0
  if (p < 0.4) return (p - 0.32) / 0.08
  if (p < 0.55) return 1
  return Math.max(0, 1 - (p - 0.55) / 0.08)
}

function section3Opacity(p: number): number {
  if (p < 0.67) return 0
  if (p < 0.75) return (p - 0.67) / 0.08
  return 1
}

export default function CinematicLanding({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const navbarRef = useRef<HTMLElement>(null)
  const section1Ref = useRef<HTMLDivElement>(null)
  const section2Ref = useRef<HTMLDivElement>(null)
  const section3Ref = useRef<HTMLDivElement>(null)

  const [menuOpen, setMenuOpen] = useState(false)

  const videoScrub = useVideoScrub(VIDEO_URL, videoRef, canvasRef)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Cached scroll geometry — recomputed only on resize/orientation
    // change, not read from the layout tree on every animation frame.
    const geometry = { scrollable: 0 }
    const measure = () => {
      geometry.scrollable = container.offsetHeight - window.innerHeight
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)

    let rafId = 0
    let lastTime = performance.now()

    const loop = (time: number) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000)
      lastTime = time

      const p = geometry.scrollable > 0 ? clamp01(window.scrollY / geometry.scrollable) : 0

      applySectionOpacity(section1Ref.current, section1Opacity(p))
      applySectionOpacity(section2Ref.current, section2Opacity(p))
      applySectionOpacity(section3Ref.current, section3Opacity(p))

      if (navbarRef.current) {
        navbarRef.current.dataset.contrast = p > NAVBAR_FLIP ? 'light' : 'dark'
      }

      videoScrub.tick(p, dt)

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div ref={containerRef} className="relative" style={{ height: '500vh' }}>
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden="true"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden="true"
          />

          <div className="pointer-events-none absolute inset-0">
            <Navbar ref={navbarRef} onMenuOpen={() => setMenuOpen(true)} />
            <div className="relative h-full w-full">
              <HeroSection ref={section1Ref} />
              <IntelligenceSection ref={section2Ref} />
              <ImpactSection ref={section3Ref} onEnterDashboard={onEnterDashboard} />
            </div>
          </div>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function applySectionOpacity(el: HTMLDivElement | null, opacity: number) {
  if (!el) return
  el.style.opacity = String(opacity)
  el.dataset.active = opacity > REVEAL_THRESHOLD ? 'true' : 'false'
}
