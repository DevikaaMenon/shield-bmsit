import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ArrowDown, Dices } from 'lucide-react'
import { reducedMotion, useRandomBattle } from '../components/ui'
import { MISSIONS } from '../data/missions'
import { useShieldStore } from '../store/useShieldStore'

/** Sits over the fixed 3D world. Left-aligned; the globe lives on the right. */
export default function Hero() {
  const root = useRef<HTMLElement>(null)
  const status = useShieldStore((s) => s.status)
  const randomBattle = useRandomBattle()
  const open = MISSIONS.filter((m) => status[m.id] !== 'Completed').length

  useLayoutEffect(() => {
    if (reducedMotion()) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.2 })
      tl.fromTo('.h-line', { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12 })
        .fromTo('.h-meta', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.07 }, '-=0.2')
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="top" ref={root} className="pointer-events-none relative flex min-h-[100svh] flex-col justify-end px-4 pt-20 pb-8 text-bone md:px-8 md:pb-12">
      <div className="h-meta label mb-6 grid max-w-xl grid-cols-2 gap-x-8 gap-y-1 text-bone/70">
        <span>Helicarrier · Iliad</span>
        <span>38.0000N / 40.0000W</span>
        <span>Clearance · Level 9</span>
        <span className="text-marvel">{open} open threats<span className="blink">_</span></span>
      </div>
      <h1 className="text-[clamp(2.25rem,11.5vw,12rem)]">
        <span className="block overflow-hidden"><span className="h-line display block">Avengers</span></span>
        <span className="block overflow-hidden"><span className="h-line display-thin block">Assemble<span className="text-marvel">.</span></span></span>
      </h1>
      <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <p className="h-meta max-w-md text-[15px] leading-6 text-bone/80">
          Earth has {MISSIONS.length} active threats. This console lets you read every hero's file, put a strike team of four or more together, send them in and fight it out.
        </p>
        <div className="h-meta pointer-events-auto flex flex-wrap gap-4">
          <a href="#assemble" className="btn btn-red">Assemble a team</a>
          <button onClick={randomBattle} className="btn btn-inv" data-cursor="Roll"><Dices size={14} /> Random battle</button>
          <a href="#command" className="btn btn-inv">Open the manual <ArrowDown size={14} /></a>
        </div>
      </div>
    </section>
  )
}
