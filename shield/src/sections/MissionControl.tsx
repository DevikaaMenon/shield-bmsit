import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Plus, Minus, Swords, Undo2, Dices } from 'lucide-react'
import { MISSIONS, THREAT_META, villainById } from '../data/missions'
import { heroById, powerScore } from '../data/heroes'
import type { Mission, Threat } from '../data/types'
import { completedCount, isSealed, MIN_TEAM, useShieldStore } from '../store/useShieldStore'
import StepImage from '../components/StepImage'
import { Countdown, Portrait, SectionHeader, StatusMark, ThreatMark, useReveal, reducedMotion } from '../components/ui'

/** Left-edge threat column: density encodes severity. */
const EDGE: Record<Threat, string> = {
  OMEGA: 'bg-marvel',
  HIGH: 'hatch',
  MEDIUM: 'border-r-2 border-marvel',
  LOW: 'border-r-2 border-ink',
}

function MissionRow({ m, index, open, onToggle }: { m: Mission; index: number; open: boolean; onToggle: () => void }) {
  const row = useRef<HTMLLIElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const status = useShieldStore((s) => s.status[m.id])
  const assigned = useShieldStore((s) => s.assignments[m.id]) ?? []
  const team = useShieldStore((s) => s.team)
  const assign = useShieldStore((s) => s.assignTeam)
  const unassign = useShieldStore((s) => s.unassign)
  const setBattle = useShieldStore((s) => s.setBattle)
  const v = villainById(m.villainId)
  const threat = useShieldStore((s) => s.threat[m.id]) ?? m.threat
  const sealed = useShieldStore((s) => isSealed(s, m))
  const remaining = useShieldStore((s) => (m.unlockAfter ?? 0) - completedCount(s))
  const done = status === 'Completed'
  const teamPower = assigned.reduce((a, id) => a + powerScore(heroById(id)), 0)
  const recommended = THREAT_META[threat].weight * 80

  useEffect(() => {
    if (open && body.current && !reducedMotion()) {
      gsap.fromTo(body.current, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.35, ease: 'power3.out' })
    }
  }, [open])

  const deploy = () => {
    if (assign(m.id) && row.current && !reducedMotion()) {
      gsap.fromTo(row.current, { backgroundColor: '#ec1d24' }, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.4, ease: 'power3.out' })
    }
  }

  return (
    <li ref={row} data-reveal className="grid grid-cols-[16px_1fr] border-t-2 border-ink">
      <span className={sealed ? 'hatch-ink' : EDGE[threat]} aria-hidden />
      <div>
        <button onClick={onToggle} aria-expanded={open} data-cursor={open ? 'Close' : 'Open'} className="grid w-full grid-cols-[1fr_auto] items-center gap-4 py-4 pl-4 text-left md:grid-cols-[48px_1fr_180px_140px_120px_40px]">
          <span className="label hidden text-ink/50 md:block">{String(index + 1).padStart(3, '0')}</span>
          <span className="min-w-0">
            <span className={`display block text-[clamp(1.1rem,2vw,1.75rem)] leading-tight ${done ? 'line-through decoration-4' : ''}`}>{m.codename}</span>
            <span className="label block text-ink/60">vs {v.name} · {m.location}</span>
            {sealed ? (
              <span className="label mt-1 inline-block bg-ink px-1 text-bone">Sealed · clear {remaining} more to unlock</span>
            ) : status === 'Pending' && threat !== 'OMEGA' ? (
              <span className="label mt-1 block">Escalates in <Countdown missionId={m.id} className="font-bold" /></span>
            ) : null}
          </span>
          <span className="hidden -space-x-2 md:flex">
            {assigned.length ? assigned.map((id) => (
              <Portrait key={id} src={heroById(id).image} alt={heroById(id).name} className="h-8 w-8 border-2 border-bone" focus={heroById(id).focus} color />
            )) : <span className="label text-ink/40">No team</span>}
          </span>
          <span className="hidden md:block"><ThreatMark threat={threat} /></span>
          <span className="hidden md:block"><StatusMark status={status} /></span>
          <span className="grid h-8 w-8 place-items-center border-2 border-ink">{open ? <Minus size={14} /> : <Plus size={14} />}</span>
        </button>

        {open && (
          <div ref={body} className="grid gap-8 pb-8 pl-4 md:grid-cols-12">
            <StepImage src={v.image} alt={v.name} className="h-48 md:col-span-5 md:h-64" color={status === 'In Progress'} position={v.focus} />
            <div className="md:col-span-7">
              <div className="mb-4 flex flex-wrap gap-2 md:hidden">
                <ThreatMark threat={threat} /> <StatusMark status={status} />
              </div>
              <p className="label">Target · {v.title}</p>
              <p className="mt-2 text-[15px] leading-6">{m.briefing}</p>
              <p className="mt-4 border-l-4 border-marvel pl-3 font-semibold">{m.objective}</p>

              <dl className="mt-6 grid grid-cols-3 border-y-2 border-ink">
                <div className="py-3 pr-3">
                  <dt className="label">Assigned</dt>
                  <dd className="display text-3xl">{assigned.length}</dd>
                </div>
                <div className="border-l-2 border-ink px-3 py-3">
                  <dt className="label">Team power</dt>
                  <dd className={`display text-3xl ${assigned.length && teamPower < recommended ? 'text-marvel' : ''}`}>{teamPower}</dd>
                </div>
                <div className="border-l-2 border-ink py-3 pl-3">
                  <dt className="label">Recommended</dt>
                  <dd className="display-thin text-3xl">{recommended}</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                {!done && (
                  <button onClick={deploy} disabled={team.length < MIN_TEAM || sealed} className="btn" title={team.length < MIN_TEAM ? `Select at least ${MIN_TEAM} heroes first` : ''}>
                    {assigned.length ? 'Send reinforcements' : 'Deploy team'} ({team.length})
                  </button>
                )}
                {!done && assigned.length > 0 && (
                  <>
                    <a href="#battle" onClick={() => setBattle(m.id)} className="btn btn-red" data-cursor="Engage"><Swords size={14} /> Engage</a>
                    <button onClick={() => unassign(m.id)} className="btn"><Undo2 size={14} /> Recall</button>
                  </>
                )}
                {done && <p className="label font-bold">Threat neutralised. File closed.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </li>
  )
}

export default function MissionControl() {
  const ref = useReveal<HTMLElement>()
  const focus = useShieldStore((s) => s.focusMission)
  const setFocus = useShieldStore((s) => s.setFocusMission)
  const team = useShieldStore((s) => s.team)
  const randomTeam = useShieldStore((s) => s.randomTeam)
  const [openId, setOpenId] = useState<string | null>(MISSIONS[0].id)

  useEffect(() => {
    if (!focus) return
    setOpenId(focus)
    setFocus(null)
  }, [focus, setFocus])

  return (
    <section id="missions" ref={ref} className="border-t-2 border-ink px-4 py-16 md:px-12 md:py-24">
      <SectionHeader index="04" code="Mission control · Hero allocation" title="Active" thin="operations">
        Open a mission, deploy the team you assembled, then engage. Higher threats need more combined power.
      </SectionHeader>

      <div data-reveal className="mb-8 flex flex-wrap items-center gap-4 bg-ink px-4 py-3 text-bone">
        <span className="label">Ready to deploy</span>
        <div className="flex -space-x-2">
          {team.map((id) => (
            <Portrait key={id} src={heroById(id).image} alt={heroById(id).name} className="h-8 w-8 border-2 border-ink" focus={heroById(id).focus} color />
          ))}
        </div>
        {team.length === 0 && <span className="text-sm text-bone/60">No heroes selected</span>}
        <button onClick={() => randomTeam()} className="label ml-auto flex items-center gap-1 border border-bone px-2 py-1 hover:bg-bone hover:text-ink" data-cursor="Roll">
          <Dices size={12} /> Random team
        </button>
        <a href="#assemble" className={`label font-bold ${team.length >= MIN_TEAM ? '' : 'text-marvel'}`}>
          {team.length >= MIN_TEAM ? `${team.length} ready ✓` : `Need ${MIN_TEAM - team.length} more → assemble`}
        </a>
      </div>

      <div className="label mb-2 hidden grid-cols-[16px_48px_1fr_180px_140px_120px_40px] gap-4 pl-4 text-ink/50 md:grid">
        <span /><span>No.</span><span>Operation</span><span>Team</span><span>Threat</span><span>Status</span><span />
      </div>
      <ul className="border-b-2 border-ink">
        {MISSIONS.map((m, i) => (
          <MissionRow key={m.id} m={m} index={i} open={openId === m.id} onToggle={() => setOpenId(openId === m.id ? null : m.id)} />
        ))}
      </ul>
    </section>
  )
}
