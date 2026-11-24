import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { RotateCcw } from 'lucide-react'
import { HEROES, heroById } from '../data/heroes'
import { MISSIONS } from '../data/missions'
import { useShieldStore } from '../store/useShieldStore'
import { fmtClock, Portrait, reducedMotion } from './ui'
import { AvengersA } from './Navbar'
import { sfx } from '../lib/sfx'

/** Full-screen end state once every mission is Completed. */
export default function Finale() {
  const ref = useRef<HTMLDivElement>(null)
  const startedAt = useShieldStore((s) => s.startedAt)
  const finishedAt = useShieldStore((s) => s.finishedAt)
  const stats = useShieldStore((s) => s.stats)
  const reset = useShieldStore((s) => s.reset)

  useLayoutEffect(() => {
    sfx('win')
    document.body.style.overflow = 'hidden'
    if (reducedMotion() || !ref.current) return () => { document.body.style.overflow = '' }
    const ctx = gsap.context(() => {
      gsap.timeline()
        .fromTo(ref.current, { clipPath: 'inset(50% 0 50% 0)' }, { clipPath: 'inset(0% 0 0% 0)', duration: 0.5, ease: 'power3.out' })
        .fromTo('.f-line', { yPercent: 105 }, { yPercent: 0, duration: 0.5, ease: 'power3.out', stagger: 0.12 })
        .fromTo('.f-stat', { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power3.out', stagger: 0.06 })
        .fromTo('.f-hero', { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.3, ease: 'power3.out', stagger: 0.04 }, '-=0.2')
    }, ref)
    return () => {
      ctx.revert()
      document.body.style.overflow = ''
    }
  }, [])

  const mvp = Object.entries(stats.damage).sort((a, b) => b[1] - a[1])[0]
  const elapsed = (finishedAt ?? Date.now()) - startedAt
  const items = [
    { k: 'Threats neutralised', v: `${MISSIONS.length}/${MISSIONS.length}` },
    { k: 'Time to save Earth', v: fmtClock(elapsed) },
    { k: 'Battles fought', v: String(stats.battles) },
    { k: 'Rounds', v: String(stats.rounds) },
    { k: 'Retreats', v: String(stats.losses) },
  ]

  return (
    <div ref={ref} data-lenis-prevent role="dialog" aria-modal="true" aria-label="Earth survives" className="fixed inset-0 z-[60] overflow-y-auto bg-ink text-bone">
      <div className="mx-auto flex min-h-full max-w-[1400px] flex-col px-4 py-10 md:px-8">
        <div className="flex items-center gap-3">
          <AvengersA className="h-10 w-9 text-marvel" />
          <span className="label">Campaign closed · all threats neutralised</span>
        </div>

        <h2 className="mt-10 text-[clamp(4rem,14vw,13rem)]">
          <span className="block overflow-hidden"><span className="f-line display block">Earth</span></span>
          <span className="block overflow-hidden"><span className="f-line display-thin block">survives<span className="text-marvel">.</span></span></span>
        </h2>

        <div className="mt-10 grid grid-cols-2 border-y-2 border-bone md:grid-cols-5">
          {items.map((it, i) => (
            <div key={it.k} className={`f-stat py-4 ${i ? 'md:border-l-2 md:border-bone md:pl-4' : ''} ${i % 2 ? 'border-l-2 border-bone pl-4 md:pl-4' : ''}`}>
              <p className="label text-bone/60">{it.k}</p>
              <p className="display mt-1 text-5xl">{it.v}</p>
            </div>
          ))}
        </div>

        {mvp && (
          <div className="f-stat mt-10 flex items-center gap-6">
            <Portrait src={heroById(mvp[0]).image} alt={heroById(mvp[0]).name} focus={heroById(mvp[0]).focus} color className="h-32 w-24 border-2 border-bone" />
            <div>
              <p className="label text-marvel">MVP · most damage dealt</p>
              <p className="display text-5xl">{heroById(mvp[0]).name}</p>
              <p className="display-thin text-3xl">{mvp[1]} damage</p>
            </div>
          </div>
        )}

        <div className="mt-10 grid grid-cols-6 gap-[2px] md:grid-cols-12">
          {HEROES.map((h) => (
            <div key={h.id} className="f-hero aspect-[3/4]">
              <Portrait src={h.image} alt={h.name} focus={h.focus} color hover={false} className="h-full w-full" />
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 pb-6">
          <button onClick={reset} className="btn btn-red" data-cursor="Restart">
            <RotateCcw size={14} /> Run it again
          </button>
          <span className="label text-bone/50">Whatever it takes.</span>
        </div>
      </div>
    </div>
  )
}
