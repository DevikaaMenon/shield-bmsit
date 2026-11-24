import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { X, ArrowRight, Dices } from 'lucide-react'
import { HEROES, heroById } from '../data/heroes'
import type { Stats } from '../data/types'
import { deployedHeroIds, MAX_TEAM, MIN_TEAM, useShieldStore } from '../store/useShieldStore'
import { Portrait, SectionHeader, useReveal, reducedMotion } from '../components/ui'

const AXES: (keyof Stats)[] = ['power', 'speed', 'intelligence', 'durability', 'combat']

function Radar({ stats }: { stats: Stats | null }) {
  const c = 110
  const R = 80
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i / AXES.length) * Math.PI * 2
    return [c + Math.cos(a) * R * (v / 100), c + Math.sin(a) * R * (v / 100)]
  }
  return (
    <svg viewBox="0 0 220 220" className="w-full max-w-[240px]" role="img" aria-label="Team stat radar">
      {[25, 50, 75, 100].map((r) => (
        <polygon key={r} points={AXES.map((_, i) => pt(i, r).join(',')).join(' ')} fill="none" stroke="var(--color-ink)" strokeOpacity={r === 100 ? 1 : 0.2} strokeWidth={r === 100 ? 2 : 1} />
      ))}
      {AXES.map((k, i) => {
        const [x, y] = pt(i, 120)
        const [lx, ly] = pt(i, 100)
        return (
          <g key={k}>
            <line x1={c} y1={c} x2={lx} y2={ly} stroke="var(--color-ink)" strokeOpacity={0.2} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="var(--color-ink)" fontSize="8" fontFamily="JetBrains Mono" style={{ textTransform: 'uppercase' }}>
              {({ power: 'PWR', speed: 'SPD', intelligence: 'INT', durability: 'DUR', combat: 'CMB' } as const)[k]}
            </text>
          </g>
        )
      })}
      {stats && (
        <polygon points={AXES.map((k, i) => pt(i, stats[k]).join(',')).join(' ')} fill="var(--color-marvel)" fillOpacity={0.85} stroke="var(--color-ink)" strokeWidth="2" />
      )}
    </svg>
  )
}

export default function TeamFormation() {
  const ref = useReveal<HTMLElement>()
  const team = useShieldStore((s) => s.team)
  const toggle = useShieldStore((s) => s.toggleTeam)
  const clear = useShieldStore((s) => s.clearTeam)
  const randomTeam = useShieldStore((s) => s.randomTeam)
  const status = useShieldStore((s) => s.status)
  const assignments = useShieldStore((s) => s.assignments)
  const deployed = useMemo(() => deployedHeroIds({ status, assignments }), [status, assignments])
  const slotsRef = useRef<HTMLDivElement>(null)
  const prevLen = useRef(team.length)

  useEffect(() => {
    if (team.length > prevLen.current && slotsRef.current && !reducedMotion()) {
      const el = slotsRef.current.children[team.length - 1]
      gsap.fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.3, ease: 'power3.out' })
    }
    prevLen.current = team.length
  }, [team.length])

  const members = team.map(heroById)
  const avg: Stats | null = members.length
    ? (Object.fromEntries(AXES.map((k) => [k, Math.round(members.reduce((a, h) => a + h.stats[k], 0) / members.length)])) as unknown as Stats)
    : null
  const roles = new Set(members.map((m) => m.role))
  const synergy = Math.min(100, roles.size * 18 + (members.length >= MIN_TEAM ? 10 : 0))
  const ready = team.length >= MIN_TEAM

  return (
    <section id="assemble" ref={ref} className="border-t-2 border-ink px-4 py-16 md:px-12 md:py-24">
      <SectionHeader index="03" code="Team formation" title="Assemble" thin="the strike team">
        Pick {MIN_TEAM} to {MAX_TEAM} heroes. Mixing roles raises synergy: a team of only powerhouses hits hard but can't heal.
      </SectionHeader>

      {/* slot strip */}
      <div ref={slotsRef} data-reveal className="grid grid-cols-3 border-2 border-ink sm:grid-cols-6">
        {Array.from({ length: MAX_TEAM }).map((_, i) => {
          const h = members[i]
          const edge = `${i % 3 ? 'border-l-2' : ''} ${i >= 3 ? 'border-t-2 sm:border-t-0' : ''} ${i === 3 ? 'sm:border-l-2' : ''} border-ink`
          return h ? (
            <div key={h.id} className={`group relative aspect-[3/4] ${edge}`}>
              <Portrait src={h.image} alt={h.name} className="h-full w-full" focus={h.focus} color />
              <div className="absolute inset-x-0 bottom-0 bg-ink p-2 text-bone">
                <p className="label text-marvel">{String(i + 1).padStart(2, '0')}</p>
                <p className="display truncate text-sm">{h.name}</p>
              </div>
              <button onClick={() => toggle(h.id)} aria-label={`Remove ${h.name}`} className="absolute top-0 right-0 grid h-8 w-8 place-items-center bg-ink text-bone hover:bg-marvel">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div key={`empty-${i}`} className={`hatch-ink flex aspect-[3/4] flex-col justify-between p-2 ${edge} ${i < MIN_TEAM ? '' : 'opacity-50'}`}>
              <span className="display-thin bg-bone text-5xl leading-none">{String(i + 1).padStart(2, '0')}</span>
              <span className="label self-start bg-bone px-1">{i < MIN_TEAM ? 'Required' : 'Optional'}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        <div data-reveal className="lg:col-span-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="label font-bold">Quick select</p>
            <button onClick={() => randomTeam()} className="btn" data-cursor="Roll">
              <Dices size={14} /> Randomize team
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {HEROES.map((h) => {
              const on = team.includes(h.id)
              const busy = deployed.has(h.id)
              return (
                <button
                  key={h.id}
                  onClick={() => toggle(h.id)}
                  disabled={busy && !on}
                  aria-pressed={on}
                  className={`flex items-center gap-2 border-2 py-1 pr-3 pl-1 text-sm font-semibold disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-40 ${on ? 'border-marvel bg-marvel text-bone' : 'border-ink hover:bg-ink hover:text-bone'}`}
                >
                  <Portrait src={h.image} alt="" className="h-7 w-7" focus={h.focus} color={on} />
                  {h.name}
                  {busy && <span className="label">· out</span>}
                </button>
              )
            })}
          </div>
        </div>

        <aside data-reveal className="lg:col-span-4">
          <div className="flex items-start gap-6">
            <Radar stats={avg} />
          </div>
          <dl className="mt-6 grid grid-cols-2 border-y-2 border-ink">
            <div className="py-4 pr-4">
              <dt className="label">Members</dt>
              <dd className={`display mt-1 text-5xl ${ready ? '' : 'text-marvel'}`}>{team.length}<span className="display-thin">/{MAX_TEAM}</span></dd>
            </div>
            <div className="border-l-2 border-ink py-4 pl-4">
              <dt className="label">Synergy</dt>
              <dd className="display mt-1 text-5xl">{synergy}<span className="display-thin">%</span></dd>
            </div>
          </dl>
          <p className="label mt-3">Roles: {roles.size ? [...roles].join(' / ') : '—'}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a href={ready ? '#missions' : undefined} aria-disabled={!ready} className={`btn btn-red ${ready ? '' : 'pointer-events-none opacity-40'}`}>
              {ready ? 'Choose a mission' : `Add ${MIN_TEAM - team.length} more`} <ArrowRight size={14} />
            </a>
            {team.length > 0 && (
              <button onClick={clear} className="label underline decoration-2 underline-offset-4 hover:text-marvel">Clear team</button>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
