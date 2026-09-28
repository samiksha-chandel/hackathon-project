'use client'
import { useState } from 'react'
import { BarChart, Bar as RB, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { ArrowRight, CheckCircle2, MapPin, Store } from 'lucide-react'
import { useApp, epr } from '@/lib/store'
import { BATCHES, RECYCLERS, REGIONS, FY, Batch, t, inr, tone, valueOf, materialsOf, suitable, YEAR } from '@/lib/logic'
import { Card, Badge, Btn, Kpi, Head, Table, Td, Sel, Bar, Modal, Empty, cn } from './ui'
import raw from '@/lib/data.json'

const G = '#2E6B49'
const mine = (oem: string) => BATCHES.filter(b => b.oem === oem)
const forecast = (bs: Batch[]) => { const m: Record<string, number> = {}; bs.forEach(b => { const k = b.eolYear <= YEAR ? `≤${YEAR}` : String(b.eolYear); m[k] = (m[k] ?? 0) + b.totalKg / 1000 }); return Object.entries(m).sort().map(([y, tonnes]) => ({ y, tonnes: Math.round(tonnes) })) }
const Chart = ({ data, k = 'tonnes', x = 'y' }: { data: any[]; k?: string; x?: string }) => <ResponsiveContainer width="100%" height={230}><BarChart data={data}><CartesianGrid vertical={false} stroke="#eef0f2" /><XAxis dataKey={x} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: '#f1f5f2' }} /><RB dataKey={k} radius={[5, 5, 0, 0]}>{data.map((d, i) => <Cell key={i} fill={String(d[x]).startsWith('≤') ? '#B45309' : G} />)}</RB></BarChart></ResponsiveContainer>

export function BatchModal({ b, onClose, goto }: { b: Batch; onClose: () => void; goto: (v: string) => void }) {
  const { s, d } = useApp(); const l = s.listings[b.id]
  const ev = [[b.my, 'Manufactured', `${b.brand} ${b.model} · ${b.chem}`], [b.sy, 'Sold', `${b.units.toLocaleString('en-IN')} units · ${b.region} region`], [YEAR, 'In service', `Age ${b.age} yrs · RUL ${b.rul.toFixed(1)}%`], [b.eolYear, b.eolYear <= YEAR ? 'EoL reached' : 'EoL forecast', `${t(b.totalKg)} t of battery waste`],
    ...(l ? [['', 'Listed on marketplace', `${l.interests.length} recycler interest(s)`]] : []), ...(l?.status === 'matched' ? [['', 'Recycler matched', RECYCLERS.find(r => r.id === l.matched)!.name], ['', 'Recovery credited', 'Counted towards EPR obligation']] : [])]
  return <Modal wide title={`${b.id} · traceability & health`} onClose={onClose}>
    <div className="grid grid-cols-4 gap-3"><Kpi label="RUL" value={`${b.rul.toFixed(1)}%`} /><Kpi label="Score" value={b.score} sub={`${b.base} + ${b.bonus} ${b.pen}`} /><Kpi label="EoL year" value={b.eolYear} /><Kpi label="Waste" value={`${t(b.totalKg)} t`} sub={`${b.unitKg} kg/unit`} /></div>
    <div className="mt-5 grid grid-cols-2 gap-6"><div><h3 className="mb-3 text-sm font-bold">Traceability trail</h3><ol className="space-y-3 border-l-2 border-slate-200 pl-4">{ev.map((e, i) => <li key={i} className="relative"><span className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-white" /><div className="text-[13px] font-semibold">{e[1]} <span className="font-normal text-slate-400">{e[0]}</span></div><div className="text-xs text-slate-500">{e[2]}</div></li>)}</ol></div>
      <div><h3 className="mb-3 text-sm font-bold">Suitable recyclers</h3><div className="space-y-2">{suitable(b).sort((a, c) => +(c.region === b.region) - +(a.region === b.region) || c.recovery - a.recovery).slice(0, 4).map(r => <div key={r.id} className="flex items-center justify-between rounded-lg border p-2.5 text-[13px]"><div><div className="font-semibold">{r.name}</div><div className="text-xs text-slate-500">{r.city} · {r.recovery}% recovery</div></div>{r.region === b.region && <Badge tone="green">Same region</Badge>}</div>)}</div>
        <div className="mt-4">{l ? <Btn className="w-full" onClick={() => { onClose(); goto('market') }}><Store size={14} />Open in marketplace</Btn> : <Btn className="w-full" onClick={() => d({ t: 'list', id: b.id })}>List batch on marketplace</Btn>}</div></div></div>
  </Modal>
}

export function Overview({ goto }: { goto: (v: string) => void }) {
  const { s } = useApp(); const bs = mine(s.oem); const e = epr(s, s.oem); const [open, setOpen] = useState<Batch>()
  const up = [...bs].filter(b => b.eolYear <= YEAR + 3).sort((a, c) => a.eolYear - c.eolYear).slice(0, 6)
  return <div className="rise"><Head title="Overview" sub={`${s.oem} · ${FY.label}`} />
    <div className="grid grid-cols-4 gap-4"><Kpi label="Batches tracked" value={bs.length} sub={`${bs.reduce((a, b) => a + b.units, 0).toLocaleString('en-IN')} units sold`} /><Kpi label="EoL waste due" value={`${t(e.due.reduce((a, b) => a + b.totalKg, 0))} t`} sub="at or near end of life" tone="text-amber-700" /><Kpi label="EPR fulfilment" value={`${e.pct.toFixed(0)}%`} sub={`target ${FY.target}%`} tone={e.pct >= FY.target ? 'text-emerald-700' : 'text-red-700'} /><Kpi label="Avg circularity score" value={Math.round(bs.reduce((a, b) => a + b.score, 0) / bs.length)} sub="out of 100" /></div>
    <div className="mt-4 grid grid-cols-5 gap-4"><Card className="col-span-3 p-5"><div className="mb-2 text-sm font-bold">Forecast battery waste by EoL year (tonnes)</div><Chart data={forecast(bs)} /></Card>
      <Card className="col-span-2 p-5"><div className="mb-3 text-sm font-bold">Upcoming EoL batches</div><div className="space-y-2">{up.map(b => <button key={b.id} onClick={() => setOpen(b)} className="flex w-full items-center justify-between rounded-lg border p-2.5 text-left hover:border-brand/40 hover:bg-brand-soft/40"><div><div className="text-[13px] font-semibold">{b.id}</div><div className="text-xs text-slate-500">{t(b.totalKg)} t · EoL {b.eolYear}</div></div><Badge tone={tone(b.status)}>{b.status}</Badge></button>)}</div></Card></div>
    {open && <BatchModal b={open} onClose={() => setOpen(undefined)} goto={goto} />}</div>
}

export function Batches({ goto }: { goto: (v: string) => void }) {
  const { s } = useApp(); const [q, setQ] = useState(''), [st, setSt] = useState(''), [open, setOpen] = useState<Batch>()
  const rows = mine(s.oem).filter(b => (!st || b.status === st) && b.id.toLowerCase().includes(q.toLowerCase()))
  return <div className="rise"><Head title="Battery inventory & traceability" sub="Every batch traced from manufacture to end of life" right={<div className="flex gap-2"><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search batch…" className="rounded-lg border border-slate-200 px-3 py-1.5 text-[13px]" /><Sel value={st} onChange={setSt} opts={['In service', 'EoL soon', 'EoL reached']} all="All status" /></div>} />
    <Card><Table empty={!rows.length} head={['Batch', 'Chemistry', 'Region', 'Units', 'Weight (t)', 'RUL', 'EoL', 'Status', '']}>{rows.map(b => <tr key={b.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setOpen(b)}><Td className="font-semibold">{b.id}</Td><Td>{b.chem}</Td><Td>{b.region}</Td><Td>{b.units.toLocaleString('en-IN')}</Td><Td>{t(b.totalKg)}</Td><Td>{b.rul.toFixed(1)}%</Td><Td>{b.eolYear}</Td><Td><Badge tone={tone(b.status)}>{b.status}</Badge></Td><Td><ArrowRight size={14} className="text-slate-400" /></Td></tr>)}</Table></Card>
    {open && <BatchModal b={open} onClose={() => setOpen(undefined)} goto={goto} />}</div>
}

export function Health() {
  const { s } = useApp(); const bs = mine(s.oem)
  return <div className="rise"><Head title="Battery health & circularity score" />
    <Card className="p-5"><div className="mb-2 text-sm font-semibold">Remaining useful capacity by batch (%)</div><Chart data={bs.map(b => ({ y: b.id.slice(0, 10), rul: +b.rul.toFixed(1) }))} k="rul" /></Card>
    <Card className="mt-4"><Table head={['Batch', 'Chemistry', 'Age', 'RUL %', 'Score']}>{bs.map(b => <tr key={b.id}><Td className="font-semibold">{b.id}</Td><Td>{b.chem}</Td><Td>{b.age}</Td><Td>{b.rul.toFixed(1)}</Td><Td><div className="flex items-center gap-2"><b className="w-7">{b.score}</b><div className="w-20"><Bar pct={b.score} tone={b.score >= 60 ? 'bg-emerald-600' : b.score >= 40 ? 'bg-amber-500' : 'bg-red-500'} /></div></div></Td></tr>)}</Table></Card></div>
}

export function Forecast() {
  const { s } = useApp(); const bs = mine(s.oem); const by: Record<string, number> = {}; bs.forEach(b => by[b.chem] = (by[b.chem] ?? 0) + b.totalKg / 1000)
  return <div className="rise"><Head title="EOL waste forecasting" sub="Forecast waste = units sold × unit weight, mapped to each batch's EoL year" />
    <div className="grid grid-cols-2 gap-4"><Card className="p-5"><div className="mb-2 text-sm font-bold">Waste by EoL year (t) — amber bar = already at EoL</div><Chart data={forecast(bs)} /></Card><Card className="p-5"><div className="mb-2 text-sm font-bold">Waste by chemistry (t)</div><Chart data={Object.entries(by).map(([y, tonnes]) => ({ y: y.replace('Lithium', 'Li').replace('Nickel', 'Ni').slice(0, 12), tonnes: Math.round(tonnes) }))} /></Card></div>
    <Card className="mt-4"><Table head={['Batch', 'Model year', 'Units sold', 'Unit weight (kg)', 'Total (t)', 'EoL year']}>{[...bs].sort((a, c) => a.eolYear - c.eolYear).map(b => <tr key={b.id}><Td className="font-semibold">{b.id}</Td><Td>{b.my}</Td><Td>{b.units.toLocaleString('en-IN')}</Td><Td>{b.unitKg}</Td><Td>{t(b.totalKg)}</Td><Td>{b.eolYear}</Td></tr>)}</Table></Card></div>
}

export function Recyclers() {
  const [rg, setRg] = useState(''), [ch, setCh] = useState('')
  const rows = RECYCLERS.filter(r => (!rg || r.region === rg) && (!ch || r.chems.includes(ch)))
  return <div className="rise"><Head title="Recycler discovery" sub="Registered recyclers by region and supported chemistry" right={<div className="flex gap-2"><Sel value={rg} onChange={setRg} opts={REGIONS} all="All regions" /><Sel value={ch} onChange={setCh} opts={[...new Set(BATCHES.map(b => b.chem))]} all="All chemistries" /></div>} />
    {!rows.length ? <Card><Empty text="No recycler supports this combination" /></Card> : <div className="grid grid-cols-2 gap-4">{rows.map(r => <Card key={r.id} className="p-5"><div className="flex items-start justify-between"><div><div className="font-bold">{r.name}</div><div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><MapPin size={12} />{r.city} · {r.region}</div></div><Badge tone="green">{r.recovery}% recovery</Badge></div><div className="mt-4 text-xs text-slate-500">Capacity {r.capT} t/yr · {r.usedPct}% utilised</div><div className="mt-1.5"><Bar pct={r.usedPct} /></div><div className="mt-3 flex flex-wrap gap-1.5">{r.chems.map(c => <Badge key={c} tone={c === ch ? 'navy' : 'gray'}>{c}</Badge>)}</div></Card>)}</div>}</div>
}

export function Market() {
  const { s, d } = useApp(); const bs = mine(s.oem).filter(b => s.listings[b.id] || b.eolYear <= YEAR + 2)
  return <div className="rise"><Head title="Marketplace — post-EoL batches" sub="List batches, review recycler interest and confirm a match" />
    <div className="space-y-3">{bs.map(b => { const l = s.listings[b.id]; return <Card key={b.id} className="p-4"><div className="flex items-center justify-between"><div><div className="font-bold">{b.id} <span className="ml-2 text-xs font-normal text-slate-500">{b.chem} · {t(b.totalKg)} t · {b.region}</span></div></div><div className="flex items-center gap-2">{!l ? <Btn onClick={() => d({ t: 'list', id: b.id })}>List batch</Btn> : <Badge tone={l.status === 'matched' ? 'green' : 'amber'}>{l.status === 'matched' ? 'Matched' : `${l.interests.length} interest(s)`}</Badge>}</div></div>
      {l && l.interests.length > 0 && <div className="mt-3 space-y-2 border-t pt-3">{l.interests.map(i => { const r = RECYCLERS.find(x => x.id === i.rid)!; const win = l.matched === i.rid; return <div key={i.rid} className={cn('flex items-center justify-between rounded-lg p-2.5 text-[13px]', win ? 'bg-brand-soft' : 'bg-slate-50')}><div><b>{r.name}</b> <span className="text-slate-500">· {r.city} · offer ₹{i.price}/kg · est. value {inr(valueOf(b, r.recovery))}</span><div className="text-xs text-slate-500">“{i.note}”</div></div>{win ? <span className="flex items-center gap-1 font-semibold text-emerald-800"><CheckCircle2 size={14} />Matched</span> : l.status === 'open' && <Btn v="outline" onClick={() => d({ t: 'accept', id: b.id, rid: i.rid })}>Accept match</Btn>}</div> })}</div>}
      {l && !l.interests.length && <div className="mt-3 border-t pt-3 text-xs text-slate-500">Waiting for recycler interest…</div>}</Card> })}</div></div>
}

export function Materials() {
  const { s } = useApp(); const bs = mine(s.oem); const rows = bs.map(b => { const l = s.listings[b.id]; const r = RECYCLERS.find(x => x.id === l?.matched); return { b, r, v: valueOf(b, r?.recovery), m: materialsOf(b, r?.recovery) } })
  const tot = rows.reduce((a, x) => a + x.v, 0), realised = rows.filter(x => x.r).reduce((a, x) => a + x.v, 0)
  return <div className="rise"><Head title="Material recovery intelligence" sub="Estimated recoverable material and value (indicative prices)" />
    <div className="mb-4 grid grid-cols-3 gap-4"><Kpi label="Potential recovery value" value={inr(tot)} /><Kpi label="Confirmed via matched recyclers" value={inr(realised)} tone="text-emerald-700" /><Kpi label="Low-value chemistry batches" value={bs.filter(b => b.lowValue).length} sub="need recovery incentives" tone="text-amber-700" /></div>
    <Card><Table head={['Batch', 'Chemistry', 'Key materials (t)', 'Recycler', 'Est. value']}>{rows.map(({ b, r, v, m }) => <tr key={b.id}><Td className="font-semibold">{b.id}</Td><Td>{b.chem} {b.lowValue && <Badge tone="amber">Low value</Badge>}</Td><Td>{m.slice(0, 4).map(x => `${x.m} ${(x.kg / 1000).toFixed(0)}`).join(' · ')}</Td><Td>{r ? <Badge tone="green">{r.name} · {r.recovery}%</Badge> : <span className="text-slate-400">Unassigned (85% assumed)</span>}</Td><Td className="font-semibold">{inr(v)}</Td></tr>)}</Table></Card></div>
}
