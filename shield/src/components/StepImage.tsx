import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { reducedMotion } from './ui'

/** Image strip with stepped pixel-cut ends. Mono by default, colour on hover or when `color`; pans on scroll. */
export default function StepImage({ src, alt, className = '', red = false, color = false, position = '50% 25%' }: {
  src: string
  alt: string
  className?: string
  red?: boolean
  color?: boolean
  position?: string
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!wrap.current || !inner.current || reducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(inner.current, { xPercent: -5 }, {
        xPercent: 5,
        ease: 'none',
        scrollTrigger: { trigger: wrap.current, start: 'top bottom', end: 'bottom top', scrub: true },
      })
      gsap.fromTo(wrap.current, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'expo.inOut' })
    }, wrap)
    return () => ctx.revert()
  }, [src])

  const pos = { objectPosition: position }
  return (
    <div ref={wrap} className={className} role="img" aria-label={alt}>
      <div className={`stepcut pt h-full w-full ${color ? 'is-color' : ''}`}>
        <div ref={inner} className="absolute inset-y-0 -left-[6%] w-[112%]">
          <img src={src} alt="" decoding="async" className="pt-mono" style={pos} />
          <img src={src} alt="" decoding="async" className="pt-color" style={pos} />
          {red && <span className="pt-red" />}
        </div>
      </div>
    </div>
  )
}
