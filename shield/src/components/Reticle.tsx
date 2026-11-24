import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { reducedMotion } from './ui'

const INTERACTIVE = 'a, button, [role="tab"], input, label, [draggable="true"], [data-cursor]'

/**
 * Targeting reticle: four corner brackets that follow the pointer and snap around
 * whatever interactive element is under it, with a mono label from `data-cursor`.
 * Desktop pointers only.
 */
export default function Reticle() {
  const box = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')
  const [enabled] = useState(() => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion())

  useEffect(() => {
    if (!enabled || !box.current || !dot.current) return
    document.documentElement.classList.add('reticle-on')
    const q = {
      x: gsap.quickTo(box.current, 'x', { duration: 0.18, ease: 'power3.out' }),
      y: gsap.quickTo(box.current, 'y', { duration: 0.18, ease: 'power3.out' }),
      w: gsap.quickTo(box.current, 'width', { duration: 0.18, ease: 'power3.out' }),
      h: gsap.quickTo(box.current, 'height', { duration: 0.18, ease: 'power3.out' }),
      dx: gsap.quickTo(dot.current, 'x', { duration: 0.05 }),
      dy: gsap.quickTo(dot.current, 'y', { duration: 0.05 }),
    }
    let current: Element | null = null

    let shown = false
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true
        gsap.set([box.current, dot.current], { opacity: 1 })
      }
      q.dx(e.clientX)
      q.dy(e.clientY)
      const target = (e.target as Element)?.closest?.(INTERACTIVE) ?? null
      if (target && !(target as HTMLButtonElement).disabled) {
        const r = target.getBoundingClientRect()
        // snap to small/medium targets; big ones (rows, panels) get a tight reticle at the pointer
        if (r.width < 420 && r.height < 260) {
          q.x(r.left - 6); q.y(r.top - 6); q.w(r.width + 12); q.h(r.height + 12)
        } else {
          q.x(e.clientX - 22); q.y(e.clientY - 22); q.w(44); q.h(44)
        }
        if (target !== current) {
          current = target
          setLabel((target as HTMLElement).dataset.cursor ?? '')
          box.current?.classList.add('is-active')
        }
      } else {
        q.x(e.clientX - 14); q.y(e.clientY - 14); q.w(28); q.h(28)
        if (current) {
          current = null
          setLabel('')
          box.current?.classList.remove('is-active')
        }
      }
    }
    const onDown = () => gsap.fromTo(box.current, { scale: 0.85 }, { scale: 1, duration: 0.2, ease: 'power3.out' })
    const onLeave = () => gsap.set([box.current, dot.current], { opacity: 0 })
    const onEnter = () => gsap.set([box.current, dot.current], { opacity: 1 })

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerenter', onEnter)
    return () => {
      document.documentElement.classList.remove('reticle-on')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerenter', onEnter)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <>
      <div ref={box} className="reticle pointer-events-none fixed top-0 left-0 z-[100] h-7 w-7 opacity-0 mix-blend-difference" aria-hidden>
        <span className="absolute top-0 left-0 h-2.5 w-2.5 border-t-2 border-l-2 border-white" />
        <span className="absolute top-0 right-0 h-2.5 w-2.5 border-t-2 border-r-2 border-white" />
        <span className="absolute bottom-0 left-0 h-2.5 w-2.5 border-b-2 border-l-2 border-white" />
        <span className="absolute right-0 bottom-0 h-2.5 w-2.5 border-r-2 border-b-2 border-white" />
        {label && <span className="label absolute top-full left-0 mt-1 bg-white px-1 whitespace-nowrap text-black">{label}</span>}
      </div>
      <div ref={dot} className="pointer-events-none fixed top-0 left-0 z-[100] -mt-[3px] -ml-[3px] h-1.5 w-1.5 bg-marvel opacity-0" aria-hidden />
    </>
  )
}
