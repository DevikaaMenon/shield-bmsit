import { useState, type DragEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MISSIONS, villainById } from '../data/missions'
import { heroById } from '../data/heroes'
import type { MissionStatus as Status } from '../data/types'
import { useShieldStore } from '../store/useShieldStore'
import { Portrait, SectionHeader, ThreatMark, useReveal } from '../components/ui'

const COLUMNS: { key: Status; hint: string }[] = [
  { key: 'Pending', hint: 'Waiting for a team' },
  { key: 'In Progress', hint: 'Team in the field' },
  { key: 'Completed', hint: 'Threat neutralised' },
]
const ORDER: Status[] = ['Pending', 'In Progress', 'Completed']

export default function MissionStatus() {
  const ref = useReveal<HTMLElement>()
  const status = useShieldStore((s) => s.status)
  const assignments = useShieldStore((s) => s.assignments)
  const setStatus = useShieldStore((s) => s.setStatus)
  const threat = useShieldStore((s) => s.threat)
  const [over, setOver] = useState<Status | null>(null)

  const done = MISSIONS.filter((m) => status[m.id] === 'Completed').length
  const pct = Math.round((done / MISSIONS.length) * 100)

  const onDrop = (e: DragEvent, col: Status) => {
    e.preventDefault()
    setOver(null)
    const id = e.dataTransfer.getData('text/plain')
    if (id && status[id] !== col) setStatus(id, col)
  }

  return (
    <section id="status" ref={ref} className="px-4 py-16 md:px-12 md:py-24">
      <SectionHeader index="06" code="Mission status" title="Operations" thin="ledger">
        Drag a mission between columns or use the arrows. A mission only goes In Progress once a team is assigned.
      </SectionHeader>

      <div data-reveal className="mb-12 grid items-end gap-6 md:grid-cols-12">
        <p className="display text-[clamp(5rem,14vw,9rem)] md:col-span-4">
          {pct}<span className="display-thin text-[0.4em]">%</span>
        </p>
        <div className="md:col-span-8">
          <p className="label mb-2">Campaign progress · {done} of {MISSIONS.length} closed</p>
          <div className="flex h-10 gap-[2px] border-2 border-ink p-[2px]">
            {MISSIONS.map((m) => {
              const s = status[m.id]
              return <div key={m.id} title={`${m.codename}: ${s}`} className={`flex-1 ${s === 'Completed' ? 'bg-ink' : s === 'In Progress' ? 'bg-marvel' : 'hatch-ink'}`} />
            })}
          </div>
        </div>
      </div>

      <div className="grid border-2 border-ink md:grid-cols-3">
        {COLUMNS.map((col, ci) => {
          const items = MISSIONS.filter((m) => status[m.id] === col.key)
          return (
            <div
              key={col.key}
              data-reveal
              onDragOver={(e) => { e.preventDefault(); setOver(col.key) }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => onDrop(e, col.key)}
              className={`min-h-[280px] ${ci ? 'border-t-2 border-ink md:border-t-0 md:border-l-2' : ''} ${over === col.key ? 'hatch' : ''}`}
            >
              <div className={`flex items-end justify-between border-b-2 border-ink p-4 ${col.key === 'In Progress' ? 'bg-marvel text-bone' : col.key === 'Completed' ? 'bg-ink text-bone' : ''}`}>
                <div>
                  <p className="display text-xl">{col.key}</p>
                  <p className="label opacity-70">{col.hint}</p>
                </div>
                <span className="display-thin text-5xl leading-none">{String(items.length).padStart(2, '0')}</span>
              </div>
              <ul>
                {items.map((m) => {
                  const idx = ORDER.indexOf(col.key)
                  const team = assignments[m.id] ?? []
                  return (
                    <li
                      key={m.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', m.id)}
                      className="cursor-grab border-b border-ink/20 bg-bone p-4 active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`display text-lg ${col.key === 'Completed' ? 'line-through decoration-2' : ''}`}>{m.codename}</p>
                        <ThreatMark threat={threat[m.id] ?? m.threat} />
                      </div>
                      <p className="label mt-1 text-ink/60">vs {villainById(m.villainId).name} · {m.location}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex -space-x-1.5">
                          {team.slice(0, 6).map((id) => (
                            <Portrait key={id} src={heroById(id).image} alt={heroById(id).name} className="h-6 w-6 border border-bone" focus={heroById(id).focus} />
                          ))}
                          {!team.length && <span className="label text-ink/40">Unassigned</span>}
                        </div>
                        <div className="flex">
                          <button
                            disabled={idx === 0}
                            onClick={() => setStatus(m.id, ORDER[idx - 1])}
                            aria-label={`Move ${m.codename} to ${ORDER[idx - 1]}`}
                            className="grid h-8 w-8 place-items-center border-2 border-ink hover:bg-ink hover:text-bone disabled:opacity-20"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button
                            disabled={idx === 2}
                            onClick={() => setStatus(m.id, ORDER[idx + 1])}
                            aria-label={`Move ${m.codename} to ${ORDER[idx + 1]}`}
                            className="-ml-[2px] grid h-8 w-8 place-items-center border-2 border-ink hover:bg-ink hover:text-bone disabled:opacity-20"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
                {!items.length && <li className="label p-6 text-ink/40">Drop a mission here</li>}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
