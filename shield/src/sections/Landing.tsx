import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowRight } from 'lucide-react'
import { HEROES } from '../data/heroes'
import { MISSIONS, villainById } from '../data/missions'
import { useShieldStore } from '../store/useShieldStore'
import { AvengersA, MarvelLogo } from '../components/Navbar'
import { Portrait, reducedMotion } from '../components/ui'
import { camRig } from '../components/ThreatGlobe'
import { sfx } from '../lib/sfx'

/** Radial speed lines used for the zoom's motion-blur feel. */
function SpeedLines() {
  const lines = Array.from({ length: 64 }, (_, i) => {
    const a = (i / 64) * Math.PI * 2 + (i % 3) * 0.02
    const r1 = 120 + (i % 5) * 40
    return { x1: 500 + Math.cos(a) * r1, y1: 500 + Math.sin(a) * r1, x2: 500 + Math.cos(a) * 1600, y2: 500 + Math.sin(a) * 1600, w: i % 4 ? 1.5 : 4 }
  })
  return (
    <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      {lines.map((l, i) => (
        <line key={i} {...l} strokeWidth={l.w} stroke={i % 7 ? 'var(--color-bone)' : 'var(--color-marvel)'} />
      ))}
    </svg>
  )
}

/**
 * Landing / home. Sits over the fixed 3D world (camera far out). "Enter" punches the camera
 * through the atmosphere with blur + speed lines, then hands over to the console.
 */
export default function Landing({ globeWrap }: { globeWrap: React.RefObject<HTMLDivElement | null> }) {
  const root = useRef<HTMLDivElement>(null)
  const lines = useRef<HTMLDivElement>(null)
  const flash = useRef<HTMLDivElement>(null)
  const setView = useShieldStore((s) => s.setView)
  const [going, setGoing] = useState(false)
  const idle = useRef<gsap.core.Tween | null>(null)

  useLayoutEffect(() => {
    camRig.z = 15
    camRig.offset = 1
    if (reducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.timeline({ delay: 0.15 })
        .fromTo('.l-line', { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12 })
        .fromTo('.l-meta', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06 }, '-=0.7')
        .fromTo('.l-strip', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'expo.inOut' }, '-=0.6')
    }, root)
    // slow drift in while idle — kept outside the context so unmount doesn't revert the camera
    idle.current = gsap.fromTo(camRig, { z: 22 }, { z: 15, duration: 3.2, ease: 'expo.out' })
    return () => {
      ctx.revert()
      idle.current?.kill()
    }
  }, [])

  const enter = useCallback(() => {
    if (going) return
    setGoing(true)
    idle.current?.kill()
    const done = () => {
      camRig.z = 7
      camRig.offset = 1
      if (globeWrap.current) {
        globeWrap.current.style.filter = ''
        globeWrap.current.style.transform = ''
      }
      window.scrollTo(0, 0)
      setView('console')
    }
    if (reducedMotion()) return done()
    sfx('whoosh')
    const wrap = globeWrap.current
    const fx = { blur: 0, scale: 1 }
    const paint = () => {
      if (!wrap) return
      wrap.style.filter = fx.blur > 0.05 ? `blur(${fx.blur.toFixed(2)}px)` : ''
      wrap.style.transform = `scale(${fx.scale.toFixed(4)})`
    }
    gsap.timeline()
      // 1. UI peels away while the Earth glides to dead centre
      .to(root.current, { opacity: 0, y: -24, duration: 0.45, ease: 'power2.in' })
      .to(camRig, { offset: 0, duration: 0.7, ease: 'power3.inOut' }, 0)
      // 2. dive straight down the camera axis into the surface
      .to(camRig, { z: 2.3, duration: 1.45, ease: 'power3.in' }, 0.35)
      // zoom blur: blur + a centred scale push so streaks radiate from the Earth
      .to(fx, { blur: 9, scale: 1.35, duration: 1.5, ease: 'power3.in', onUpdate: paint }, 0.35)
      .fromTo(lines.current, { scale: 0.9, opacity: 0 }, { scale: 2.4, opacity: 0.85, duration: 1.5, ease: 'power2.in' }, 0.35)
      // 3. punch through: bright flash, cut to the console underneath
      .to(flash.current, { opacity: 1, duration: 0.12, ease: 'power1.in' }, 1.72)
      .call(done, [], 1.86)
  }, [going, globeWrap, setView])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Enter' && enter()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enter])

  const strip = [...HEROES, ...HEROES]

  return (
    <>
      <div ref={root} className="pointer-events-none fixed inset-0 z-30 flex flex-col text-bone">
        {/* header */}
        <header className="pointer-events-auto flex items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <MarvelLogo className="h-7" />
            <AvengersA className="h-8 w-7 text-bone" />
          </div>
          <p className="l-meta label hidden text-bone/60 md:block">S.H.I.E.L.D. crisis command · clearance level 9</p>
        </header>

        <div className="flex flex-1 flex-col justify-center px-4 md:px-8">
          <div className="l-meta label mb-6 flex flex-wrap gap-x-8 gap-y-1 text-bone/70">
            <span className="text-marvel">● {MISSIONS.length} active threats</span>
            <span>{HEROES.length} heroes on standby</span>
            <span>Final boss: {villainById('doom').name}</span>
          </div>
          <h1 className="max-w-[60vw] text-[clamp(3.4rem,15vw,11rem)] max-md:max-w-none">
            <span className="block overflow-hidden"><span className="l-line display block">Earth's mightiest</span></span>
            <span className="block overflow-hidden"><span className="l-line display-thin block">need a commander<span className="text-marvel">.</span></span></span>
          </h1>
          <div className="l-meta pointer-events-auto mt-8 flex flex-wrap items-center gap-4">
            <button onClick={enter} className="btn btn-red text-sm" data-cursor="Enter">
              Enter S.H.I.E.L.D. command <ArrowRight size={16} />
            </button>
            <span className="label text-bone/50">or press Enter ↵</span>
          </div>
        </div>

        {/* roster strip */}
        <div className="l-strip pointer-events-auto overflow-hidden border-t-2 border-bone/30 py-3">
          <div className="marquee flex w-max gap-2 [animation-duration:60s] hover:[animation-play-state:paused]">
            {strip.map((h, i) => (
              <div key={i} className="group relative h-40 w-28 shrink-0 border-2 border-bone/40 md:h-52 md:w-36" data-cursor={h.name}>
                <Portrait src={h.image} alt={h.name} focus={h.focus} className="h-full w-full" />
                <span className="label absolute inset-x-0 bottom-0 bg-ink px-1 text-bone">{h.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* zoom overlays */}
      <div ref={lines} className="pointer-events-none fixed inset-0 z-40 opacity-0" aria-hidden>
        <SpeedLines />
      </div>
      <div ref={flash} className="pointer-events-none fixed inset-0 z-50 bg-bone opacity-0" aria-hidden />
    </>
  )
}
