import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { MissionStatus, Threat } from '../data/types'
import { useShieldStore } from '../store/useShieldStore'

gsap.registerPlugin(ScrollTrigger)

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Mechanical reveal: children marked [data-reveal] step in as the section enters. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    if (!ref.current || reducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-reveal]',
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'expo.out',
          stagger: 0.07,
          scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
        },
      )
    }, ref)
    return () => ctx.revert()
  }, [])
  return ref
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/\\_'

/** Text that decodes from random glyphs when it scrolls into view. */
export function Scramble({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion()) return
    let raf = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const dur = 700
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur)
        const n = Math.floor(p * text.length)
        el.textContent =
          text.slice(0, n) +
          text
            .slice(n)
            .split('')
            .map((c) => (c === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join('')
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      el.textContent = text
    }
  }, [text])
  return (
    <span ref={ref} className={className} aria-label={text}>
      {text}
    </span>
  )
}

/** Index · heavy title · thin title · note column. Left-aligned, never centered. */
export function SectionHeader({ index, code, title, thin, children }: {
  index: string
  code: string
  title: string
  thin?: string
  children?: ReactNode
}) {
  return (
    <header className="mb-12 grid gap-6 md:grid-cols-12">
      <div data-reveal className="label flex gap-4 md:col-span-12">
        <span className="bg-ink px-2 text-bone">{index}</span>
        <span>{code}</span>
        <span className="hidden flex-1 border-b border-ink/30 md:block" />
      </div>
      <h2 data-reveal className="md:col-span-8">
        <Scramble text={title} className="display block text-[clamp(2.5rem,6vw,4.5rem)]" />
        {thin && <span className="display-thin block text-[clamp(2.5rem,6vw,4.5rem)]">{thin}</span>}
      </h2>
      {children && (
        <p data-reveal className="max-w-sm text-[15px] leading-6 md:col-span-4 md:self-end">
          {children}
        </p>
      )}
    </header>
  )
}

/** Threat encoded by fill density, not hue (see DESIGN.md). */
export function ThreatMark({ threat, className = '' }: { threat: Threat; className?: string }) {
  const style: Record<Threat, string> = {
    OMEGA: 'bg-marvel text-bone border-marvel',
    HIGH: 'hatch text-ink border-marvel bg-bone',
    MEDIUM: 'text-marvel border-marvel bg-bone',
    LOW: 'text-ink border-ink bg-bone',
  }
  return (
    <span className={`label inline-flex items-center border-2 px-2 font-bold ${style[threat]} ${className}`}>
      <span className={threat === 'HIGH' ? 'bg-bone px-1' : ''}>{threat}</span>
    </span>
  )
}

export function StatusMark({ status }: { status: MissionStatus }) {
  if (status === 'In Progress') return <span className="label bg-marvel px-2 font-bold text-bone">In progress</span>
  if (status === 'Completed') return <span className="label border-2 border-ink bg-ink px-2 font-bold text-bone line-through decoration-2">Completed</span>
  return <span className="label border-2 border-ink px-2 font-bold">Pending</span>
}

/** Segmented technical bar. */
export function StatBar({ label, value, red = false, segments = 20 }: { label: string; value: number; red?: boolean; segments?: number }) {
  const on = Math.round((value / 100) * segments)
  return (
    <div>
      <div className="label mb-1 flex justify-between">
        <span>{label}</span>
        <span className="font-bold">{String(value).padStart(3, '0')}</span>
      </div>
      <div className="flex h-3 gap-[2px]" aria-hidden>
        {Array.from({ length: segments }).map((_, i) => (
          <span key={i} className={`flex-1 ${i < on ? (red ? 'bg-marvel' : 'bg-ink') : 'bg-ink/10'}`} />
        ))}
      </div>
    </div>
  )
}

/**
 * Character art. Loads a tiny blurred placeholder, then the 900px cover art in mono;
 * full colour wipes in on hover (or always, with `color`). `red` = deployed duotone.
 */
export function Portrait({ src, alt, className = '', focus = '50% 25%', color = false, red = false, hover = true }: {
  src: string
  alt: string
  className?: string
  focus?: string
  color?: boolean
  red?: boolean
  hover?: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const lo = src.startsWith('/art/') ? src.replace(/\.jpg$/, '.lo.jpg') : null
  if (failed) {
    const initials = alt.split(' ').map((w) => w[0]).join('').slice(0, 2)
    return (
      <div className={`display grid place-items-center bg-ink text-2xl text-bone ${className}`} aria-label={alt}>
        {initials}
      </div>
    )
  }
  const pos = { objectPosition: focus }
  return (
    <div className={`pt ${color ? 'is-color' : ''} ${hover ? '' : 'no-hover'} ${className}`} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
      {lo && !loaded && <img src={lo} alt="" aria-hidden className="pt-lo" style={pos} />}
      <img src={src} alt="" aria-hidden loading="lazy" decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} className="pt-mono" style={pos} />
      <img src={src} alt="" aria-hidden loading="lazy" decoding="async" className="pt-color" style={pos} />
      {red && <span className="pt-red" />}
    </div>
  )
}

/** Tweened integer, zero-padded. */
export function Counter({ value, className = '', pad = 2 }: { value: number; className?: string; pad?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const last = useRef(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obj = { v: last.current }
    const tween = gsap.to(obj, {
      v: value,
      duration: reducedMotion() ? 0 : 1.2,
      ease: 'power2.out',
      onUpdate: () => { el.textContent = String(Math.round(obj.v)).padStart(pad, '0') },
    })
    last.current = value
    return () => { tween.kill() }
  }, [value, pad])
  return <span ref={ref} className={className}>{'0'.repeat(pad)}</span>
}

/** Re-renders every second; shared by countdowns. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

export const fmtClock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** Time until a mission escalates (frozen while the clock is paused). */
export function Countdown({ missionId, className = '' }: { missionId: string; className?: string }) {
  const now = useNow()
  const at = useShieldStore((s) => s.escalateAt[missionId])
  const paused = useShieldStore((s) => s.clockPaused)
  const left = useShieldStore((s) => s.pausedLeft[missionId])
  const ms = paused ? left ?? 0 : (at ?? now) - now
  return <span className={`tabular-nums ${ms < 20_000 && !paused ? 'text-marvel' : ''} ${className}`}>{fmtClock(ms)}</span>
}

/** Scroll to a section, through Lenis when it's running so the two don't fight. */
export function scrollToId(id: string) {
  const lenis = (window as unknown as { __lenis?: { scrollTo: (t: string, o?: object) => void } }).__lenis
  if (lenis) lenis.scrollTo(`#${id}`, { offset: -64, duration: 1.4 })
  else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

/** Random team → random open mission → straight into the arena. */
export function useRandomBattle() {
  const randomBattle = useShieldStore((s) => s.randomBattle)
  return () => {
    if (randomBattle()) setTimeout(() => scrollToId('battle'), 60)
  }
}

export const toneMark = (t: string) => (t === 'alert' ? '■' : t === 'warn' ? '▲' : t === 'ok' ? '●' : '—')

export function Toast() {
  const toast = useShieldStore((s) => s.toast)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!toast) return
    setVisible(true)
    const id = setTimeout(() => setVisible(false), 3200)
    return () => clearTimeout(id)
  }, [toast])
  if (!toast || !visible) return null
  const alert = toast.tone === 'alert' || toast.tone === 'warn'
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 z-50 w-[min(92vw,440px)] border-2 border-ink px-4 py-3 shadow-[6px_6px_0_var(--color-ink)] ${alert ? 'bg-marvel text-bone' : 'bg-bone text-ink'}`}
    >
      <p className="label font-bold">{toneMark(toast.tone)} Comms</p>
      <p className="mt-1 text-sm">{toast.text}</p>
    </div>
  )
}
