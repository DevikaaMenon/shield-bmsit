import { HEROES } from '../data/heroes'
import { MISSIONS, THREAT_META, villainById } from '../data/missions'
import { deployedHeroIds, isSealed, useShieldStore } from '../store/useShieldStore'
import type { Threat } from '../data/types'
import { Countdown, Counter, Portrait, SectionHeader, StatusMark, ThreatMark, toneMark, useReveal } from '../components/ui'

/** 100% = every mission open at OMEGA. */
const MAX_WEIGHT = MISSIONS.length * THREAT_META.OMEGA.weight

function level(pct: number) {
  if (pct >= 70) return 'Critical'
  if (pct >= 45) return 'Severe'
  if (pct >= 20) return 'Elevated'
  if (pct > 0) return 'Guarded'
  return 'Secure'
}

/** 40-segment meter; segments past 70% go red. */
function Meter({ pct }: { pct: number }) {
  const n = 40
  const on = Math.round((pct / 100) * n)
  return (
    <div>
      <div className="flex h-16 items-end gap-[3px]" aria-label={`Threat index ${pct}%`}>
        {Array.from({ length: n }).map((_, i) => (
          <span
            key={i}
            className={`flex-1 ${i < on ? (i >= n * 0.7 ? 'bg-marvel' : 'bg-ink') : 'bg-ink/10'}`}
            style={{ height: `${30 + (i / n) * 70}%` }}
          />
        ))}
      </div>
      <div className="label mt-2 flex justify-between text-ink/60">
        <span>000</span><span>Guarded</span><span>Elevated</span><span>Severe</span><span>100</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const ref = useReveal<HTMLElement>()
  const status = useShieldStore((s) => s.status)
  const assignments = useShieldStore((s) => s.assignments)
  const log = useShieldStore((s) => s.log)
  const threat = useShieldStore((s) => s.threat)
  const escalateAt = useShieldStore((s) => s.escalateAt)
  const paused = useShieldStore((s) => s.clockPaused)
  const toggleClock = useShieldStore((s) => s.toggleClock)
  const t = (id: string, base: Threat) => threat[id] ?? base
  const nextUp = MISSIONS.filter((m) => status[m.id] === 'Pending' && t(m.id, m.threat) !== 'OMEGA' && !isSealed({ status }, m))
    .sort((a, b) => (escalateAt[a.id] ?? 0) - (escalateAt[b.id] ?? 0))[0]
  const deployed = deployedHeroIds({ status, assignments })

  const open = MISSIONS.filter((m) => status[m.id] !== 'Completed')
  const weight = open.reduce((a, m) => a + THREAT_META[t(m.id, m.threat)].weight * (status[m.id] === 'In Progress' ? 0.6 : 1), 0)
  const pct = Math.round((weight / MAX_WEIGHT) * 100)
  const count = (s: string) => MISSIONS.filter((m) => status[m.id] === s).length

  const stats = [
    { label: 'Active missions', value: count('In Progress'), note: 'Teams in the field' },
    { label: 'Pending threats', value: count('Pending'), note: 'Waiting for a team' },
    { label: 'Heroes available', value: HEROES.length - deployed.size, note: `${deployed.size} deployed` },
    { label: 'Neutralised', value: count('Completed'), note: `of ${MISSIONS.length}` },
  ]

  return (
    <section id="command" ref={ref} className="px-4 py-16 md:px-12 md:py-24">
      <SectionHeader index="01" code="Command dashboard" title="Global threat" thin="board">
        Live readout of every incident, who is in the field and who is still on the bench.
      </SectionHeader>

      {/* index row */}
      <div data-reveal className="grid gap-8 border-y-2 border-ink py-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="label">Global threat index</p>
          <p className="display mt-2 text-[clamp(5rem,12vw,9rem)] text-marvel">
            <Counter value={pct} pad={2} />
            <span className="display-thin text-[0.4em] text-ink">%</span>
          </p>
          <p className="label mt-1 font-bold">Condition: {level(pct)}</p>
          <div className="mt-6 flex items-end gap-4 border-t-2 border-ink pt-4">
            <div>
              <p className="label">Doomsday clock{nextUp ? ` · ${nextUp.codename}` : ''}</p>
              {nextUp ? <Countdown missionId={nextUp.id} className="display text-5xl" /> : <span className="display-thin text-5xl">--:--</span>}
            </div>
            <button onClick={toggleClock} className="btn ml-auto" data-cursor={paused ? 'Resume' : 'Pause'}>
              {paused ? 'Resume clock' : 'Pause clock'}
            </button>
          </div>
        </div>
        <div className="md:col-span-8 md:self-end">
          <Meter pct={pct} />
        </div>
      </div>

      {/* numerals — divided by rules, not boxes */}
      <div className="grid grid-cols-2 border-b-2 border-ink md:grid-cols-4">
        {stats.map((s, i) => (
          <div data-reveal key={s.label} className={[
              'border-ink py-6',
              i % 2 ? 'border-l-2 pl-4' : 'pr-4',
              i >= 2 ? 'border-t-2 md:border-t-0' : '',
              i === 2 ? 'md:border-l-2' : '',
              i ? 'md:px-6' : 'md:pr-6',
            ].join(' ')}>
            <p className="label">{s.label}</p>
            <Counter value={s.value} className="display mt-2 block text-[clamp(3rem,6vw,4.5rem)]" />
            <p className="label mt-1 text-ink/60">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-12">
        {/* feed */}
        <div data-reveal className="md:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <p className="label font-bold">Incident feed</p>
            <span className="label bg-marvel px-2 text-bone">● Live</span>
          </div>
          <ul data-lenis-prevent className="scrollbar-thin max-h-72 overflow-y-auto">
            {log.slice(0, 12).map((e) => (
              <li key={e.id} className="grid grid-cols-[24px_72px_1fr] gap-2 border-t border-ink/20 py-2 font-mono text-xs">
                <span className={e.tone === 'alert' || e.tone === 'warn' ? 'text-marvel' : ''}>{toneMark(e.tone)}</span>
                <span className="text-ink/60">{e.time}</span>
                <span>{e.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* hotspots as a spec table */}
        <div data-reveal className="md:col-span-5">
          <p className="label mb-4 font-bold">Hotspots</p>
          <table className="w-full font-mono text-xs">
            <tbody>
              {MISSIONS.map((m) => (
                <tr key={m.id} className="border-t border-ink/20">
                  <td className="py-2 pr-2"><Portrait src={villainById(m.villainId).image} alt={villainById(m.villainId).name} className="h-8 w-8" focus={villainById(m.villainId).focus} /></td>
                  <td className="py-2 pr-2">{m.location}</td>
                  <td className="py-2 pr-2"><ThreatMark threat={t(m.id, m.threat)} /></td>
                  <td className="py-2 text-right"><StatusMark status={status[m.id]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* roster strip */}
      <div data-reveal className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <p className="label font-bold">Roster · {HEROES.length - deployed.size} available</p>
          <a href="#assemble" className="label underline decoration-2 underline-offset-4 hover:text-marvel">Assemble →</a>
        </div>
        <div className="grid grid-cols-6 gap-[2px] bg-ink p-[2px] md:grid-cols-12">
          {HEROES.map((h) => {
            const busy = deployed.has(h.id)
            return (
              <div key={h.id} title={`${h.name}${busy ? ' — deployed' : ''}`} className="group relative aspect-square">
                <Portrait src={h.image} alt={h.name} className="h-full w-full" focus={h.focus} red={busy} />
                {busy && <span className="label absolute inset-x-0 bottom-0 bg-ink text-center text-[9px] text-bone">Out</span>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
