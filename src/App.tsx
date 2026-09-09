import { useCallback, useEffect, useState } from 'react'
import CinematicLanding from '@/components/CinematicLanding'
import RiskDashboard from '@/components/RiskDashboard'

type View = 'landing' | 'dashboard'

function readViewFromHash(): View {
  return window.location.hash === '#dashboard' ? 'dashboard' : 'landing'
}

/**
 * The app has exactly two views and no need for a routing library: the
 * URL hash is the single source of truth, so the browser's Back/Forward
 * buttons work for free via the native `hashchange` event.
 */
export default function App() {
  const [view, setView] = useState<View>(() => readViewFromHash())

  useEffect(() => {
    const onHashChange = () => setView(readViewFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const enterDashboard = useCallback(() => {
    window.location.hash = 'dashboard'
  }, [])

  const exitToLanding = useCallback(() => {
    window.location.hash = ''
  }, [])

  if (view === 'dashboard') {
    return <RiskDashboard onExitToLanding={exitToLanding} />
  }

  return <CinematicLanding onEnterDashboard={enterDashboard} />
}
