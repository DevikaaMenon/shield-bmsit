import { useCallback, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { HEROES, powerScore } from '../data/heroes'
import type { Role } from '../data/types'
import { deployedHeroIds, useShieldStore } from '../store/useShieldStore'
import HeroRow from '../components/HeroCard'
import Dossier from '../components/Dossier'
import StepImage from '../components/StepImage'
import { SectionHeader, StatBar, useReveal } from '../components/ui'

const ROLES: (Role | 'All')[] = ['All', 'Powerhouse', 'Tech', 'Mystic', 'Tactician', 'Infiltrator', 'Marksman']

export default function Database() {
  const ref = useReveal<HTMLElement>()
  const [q, setQ] = useState('')
  const [role, setRole] = useState<Role | 'All'>('All')
  const [openId, setOpenId] = useState<string | null>(null)
  const [focusId, setFocusId] = useState(HEROES[0].id)
  const team = useShieldStore((s) => s.team)
  const toggle = useShieldStore((s) => s.toggleTeam)
  const status = useShieldStore((s) => s.status)
  const assignments = useShieldStore((s) => s.assignments)
  const deployed = useMemo(() => deployedHeroIds({ status, assignments }), [status, assignments])

  const list = HEROES.filter(
    (h) =>
      (role === 'All' || h.role === role) &&
      (h.name + h.realName + h.abilities.map((a) => a.name).join(' ')).toLowerCase().includes(q.toLowerCase()),
  )
  const focus = HEROES.find((h) => h.id === focusId)!
  const open = openId ? HEROES.find((h) => h.id === openId) : null
  const close = useCallback(() => setOpenId(null), [])

  return (
    <section id="database" ref={ref} className="border-t-2 border-ink px-4 py-16 md:px-12 md:py-24">
      <SectionHeader index="02" code="Avengers database" title="Personnel" thin="files">
        Twelve active-duty heroes. Hover a line to preview, open it for the full file, or press + to add them to your strike team.
      </SectionHeader>

      <div data-reveal className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center">
        <label className="flex flex-1 items-center gap-3 border-2 border-ink px-4 py-3 lg:max-w-xs">
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or ability"
            className="w-full bg-transparent font-mono text-sm placeholder:text-ink/40 focus:outline-none"
          />
        </label>
        <div className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist" aria-label="Filter by role">
          {ROLES.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={role === r}
              onClick={() => setRole(r)}
              className={`label shrink-0 px-2 py-1 ${role === r ? 'boxed font-bold text-marvel' : 'text-ink/50 hover:text-ink'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="label hidden grid-cols-[40px_1fr_110px_56px_40px] gap-4 pb-2 text-ink/50 md:grid">
            <span>No.</span><span>Name / role</span><span>Status</span><span>Rtg</span><span>Team</span>
          </div>
          {list.length === 0 ? (
            <p className="border-t-2 border-ink py-12 font-mono text-sm">
              No hero matches “{q}”. Try a name like Thor or an ability like “beam”.
            </p>
          ) : (
            <ul className="border-b-2 border-ink">
              {list.map((h) => (
                <HeroRow
                  key={h.id}
                  hero={h}
                  index={HEROES.indexOf(h)}
                  focused={focusId === h.id}
                  onFocus={() => setFocusId(h.id)}
                  selected={team.includes(h.id)}
                  deployed={deployed.has(h.id)}
                  onOpen={() => setOpenId(h.id)}
                  onToggle={() => toggle(h.id)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* sticky preview */}
        <aside className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-20">
            <StepImage key={focus.id} src={focus.image} alt={focus.name} className="h-[460px]" position={focus.focus} color={team.includes(focus.id)} />
            <div className="mt-6 flex items-baseline justify-between">
              <p className="display text-4xl">{focus.name}</p>
              <p className="display-thin text-5xl">{powerScore(focus)}</p>
            </div>
            <p className="mt-2 text-[15px] leading-6">{focus.bio}</p>
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3">
              <StatBar label="Power" value={focus.stats.power} />
              <StatBar label="Speed" value={focus.stats.speed} />
              <StatBar label="Intel" value={focus.stats.intelligence} />
              <StatBar label="Durability" value={focus.stats.durability} />
              <StatBar label="Combat" value={focus.stats.combat} red />
            </div>
          </div>
        </aside>
      </div>

      {open && (
        <Dossier hero={open} selected={team.includes(open.id)} deployed={deployed.has(open.id)} onClose={close} onToggle={() => toggle(open.id)} />
      )}
    </section>
  )
}
