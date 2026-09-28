'use client'
import { useState } from 'react'
import { useApp, epr } from '@/lib/store'
import { BATCHES, RECYCLERS, OEMS, REGIONS, FY, Batch, t, inr, valueOf, materialsOf, YEAR, tone } from '@/lib/logic'
import { Card, Badge, Btn, Kpi, Head, Table, Td, Sel, Bar, Modal, Empty } from './ui'
import { BarChart, Bar as RB, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

const listed = (s: ReturnType<typeof useApp>['s']) => BATCHES.filter(b => s.listings[b.id])
export function RDash({ goto }: { goto: (v: string) => void }) {
  const { s } = useApp(); const r = RECYCLERS.find(x => x.id === s.rid)!
  const opps = listed(s).filter(b => r.chems.includes(b.chem) && s.listings[b.id].status === 'open')
  const mineI = listed(s).filter(b => s.listings[b.id].interests.some(i => i.rid === r.id)), won = mineI.filter(b => s.listings[b.id].matched === r.id)
  return <div className="rise"><Head title="Recycler dashboard" sub={`${r.name} · ${r.city}`} />
    <div className="grid grid-cols-4 gap-4"><Kpi label="Open opportunities" value={opps.length} sub="in your chemistries" /><Kpi label="Incoming tonnage" value={`${t(opps.reduce((a, b) => a + b.totalKg, 0))} t`} /><Kpi label="Interests submitted" value={mineI.length} sub={`${won.length} matched`} tone="text-emerald-700" /><Kpi label="Capacity utilised" value={`${r.usedPct}%`} sub={`${r.capT} t/yr`} /></div>
    <Card className="mt-4 p-5"><div className="mb-3 flex items-center justify-between text-sm font-bold">Best-value opportunities<Btn v="outline" onClick={() => goto('opps')}>View all</Btn></div>{opps.length ? [...opps].sort((a, b) => valueOf(b, r.recovery) - valueOf(a, r.recovery)).slice(0, 4).map(b => <div key={b.id} className="flex items-center justify-between border-b py-2.5 text-[13px] last:border-0"><span><b>{b.id}</b> <span className="text-slate-500">· {b.oem} · {b.chem}</span></span><span className="font-semibold">{inr(valueOf(b, r.recovery))}</span></div>) : <Empty text="No open opportunities for your chemistries" />}</Card></div>
}
export function Opps() {
  const { s, d } = useApp(); const r = RECYCLERS.find(x => x.id === s.rid)!; const [rg, setRg] = useState(''), [sel, setSel] = useState<Batch>(), [price, setPrice] = useState(40), [note, setNote] = useState('')
  const rows = listed(s).filter(b => (!rg || b.region === rg) && r.chems.includes(b.chem))
  return <div className="rise"><Head title="Available EoL opportunities" sub="Marketplace listings matching your supported chemistry" right={<Sel value={rg} onChange={setRg} opts={REGIONS} all="All regions" />} />
    <Card><Table empty={!rows.length} head={['Batch', 'OEM', 'Chemistry', 'Region', 'Tonnes', 'Est. value', 'Status', '']}>{rows.map(b => { const l = s.listings[b.id], mine = l.interests.some(i => i.rid === r.id); return <tr key={b.id}><Td className="font-semibold">{b.id}</Td><Td>{b.oem}</Td><Td>{b.chem}</Td><Td>{b.region}</Td><Td>{t(b.totalKg)}</Td><Td>{inr(valueOf(b, r.recovery))}</Td><Td>{l.status === 'matched' ? <Badge tone={l.matched === r.id ? 'green' : 'gray'}>{l.matched === r.id ? 'Won' : 'Closed'}</Badge> : mine ? <Badge tone="amber">Interest sent</Badge> : <Badge>Open</Badge>}</Td><Td>{l.status === 'open' && !mine && <Btn onClick={() => { setSel(b); setNote('') }}>Submit interest</Btn>}</Td></tr> })}</Table></Card>
    {sel && <Modal title={`Submit interest · ${sel.id}`} onClose={() => setSel(undefined)}>
      <div className="mb-4 rounded-lg bg-slate-50 p-3 text-[13px]"><b>Recovery info</b><div className="mt-1 text-slate-600">{materialsOf(sel, r.recovery).map(m => `${m.m} ${(m.kg / 1000).toFixed(0)} t`).join(' · ')}</div><div className="mt-1 font-semibold">Est. value at your {r.recovery}% recovery: {inr(valueOf(sel, r.recovery))}</div></div>
      <label className="text-xs font-semibold text-slate-500">Offer (₹/kg)</label><input type="number" value={price} onChange={e => setPrice(+e.target.value)} className="mb-3 mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
      <label className="text-xs font-semibold text-slate-500">Note to OEM</label><textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
      <Btn className="mt-4 w-full" onClick={() => { d({ t: 'interest', id: sel.id, rid: r.id, price, note: note || 'Interested in this batch.' }); setSel(undefined) }}>Send interest</Btn></Modal>}</div>
}
export function Capacity() {
  const { s } = useApp(); const r = RECYCLERS.find(x => x.id === s.rid)!; const y: Record<string, number> = {}
  BATCHES.filter(b => r.chems.includes(b.chem) && b.eolYear >= YEAR).forEach(b => y[b.eolYear] = (y[b.eolYear] ?? 0) + b.totalKg / 1000)
  const data = Object.entries(y).sort().map(([k, v]) => ({ y: k, tonnes: Math.round(v) })), free = Math.round(r.capT * (1 - r.usedPct / 100))
  return <div className="rise"><Head title="Capacity planning" sub="Forecast incoming EoL tonnage for your chemistries vs free annual capacity" />
    <div className="grid grid-cols-3 gap-4"><Kpi label="Annual capacity" value={`${r.capT} t`} /><Kpi label="Free capacity" value={`${free} t`} tone="text-emerald-700" /><Kpi label="Recovery rate" value={`${r.recovery}%`} /></div>
    <Card className="mt-4 p-5"><div className="mb-2 text-sm font-bold">Forecast incoming tonnage by EoL year (t)</div><ResponsiveContainer width="100%" height={240}><BarChart data={data}><CartesianGrid vertical={false} stroke="#eef0f2" /><XAxis dataKey="y" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} /><Tooltip /><ReferenceLine y={free} stroke="#B45309" strokeDasharray="4 4" label={{ value: 'free capacity', fontSize: 11, fill: '#B45309' }} /><RB dataKey="tonnes" fill="#2E6B49" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></Card>
    <Card className="mt-4 p-5"><div className="mb-2 text-sm font-bold">Supported chemistry</div><div className="flex flex-wrap gap-2">{r.chems.map(c => <Badge key={c} tone="navy">{c}</Badge>)}</div></Card></div>
}
export function Regulator() {
  const { s } = useApp(); const [tab, setTab] = useState('oem'); const [rg, setRg] = useState('')
  const recs = BATCHES.filter(b => s.listings[b.id]?.status === 'matched' && (!rg || b.region === rg))
  return <div className="rise"><Head title="SPCB / CPCB inspection view" sub={`${FY.label} · read-only compliance overview`} right={<div className="flex gap-1 rounded-lg bg-slate-200/60 p-1">{[['oem', 'OEMs'], ['rec', 'Recyclers'], ['trace', 'Traceability & EPR records']].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`rounded-md px-3 py-1 text-[13px] font-semibold ${tab === k ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{l}</button>)}</div>} />
    <Card>{tab === 'oem' && <Table head={['OEM', 'Batches', 'Obligation (t)', 'Fulfilled (t)', 'Progress', 'Status']}>{OEMS.map(o => { const e = epr(s, o); const ok = e.pct >= FY.target; return <tr key={o}><Td className="font-semibold">{o}</Td><Td>{BATCHES.filter(b => b.oem === o).length}</Td><Td>{t(e.obligation)}</Td><Td>{t(e.fulfilled)}</Td><Td><div className="w-28"><Bar pct={e.pct} tone={ok ? 'bg-emerald-600' : 'bg-amber-500'} /></div></Td><Td><Badge tone={ok ? 'green' : e.pct > 40 ? 'amber' : 'red'}>{ok ? 'Compliant' : `${e.pct.toFixed(0)}% of target`}</Badge></Td></tr> })}</Table>}
      {tab === 'rec' && <Table head={['Recycler', 'Region', 'Capacity (t/yr)', 'Recovery', 'Vs target', 'Batches received']}>{RECYCLERS.map(r => <tr key={r.id}><Td className="font-semibold">{r.name}</Td><Td>{r.region}</Td><Td>{r.capT}</Td><Td>{r.recovery}%</Td><Td><Badge tone={r.recovery >= FY.target ? 'green' : 'amber'}>{r.recovery >= FY.target ? 'Meets' : `${FY.target - r.recovery} pts short`}</Badge></Td><Td>{BATCHES.filter(b => s.listings[b.id]?.matched === r.id).length}</Td></tr>)}</Table>}
      {tab === 'trace' && <><div className="flex justify-end p-3"><Sel value={rg} onChange={setRg} opts={REGIONS} all="All regions" /></div><Table empty={!recs.length} head={['Batch', 'OEM', 'Chemistry', 'Sold', 'EoL', 'Recycler', 'Tonnes', 'Certificate']}>{recs.map(b => { const r = RECYCLERS.find(x => x.id === s.listings[b.id].matched)!; return <tr key={b.id}><Td className="font-semibold">{b.id}</Td><Td>{b.oem}</Td><Td>{b.chem}</Td><Td>{b.sy}</Td><Td>{b.eolYear}</Td><Td>{r.name}</Td><Td>{t(b.totalKg)}</Td><Td><Badge tone="green">EPR-{b.my}-{r.id}-{b.units % 9000}</Badge></Td></tr> })}</Table></>}</Card></div>
}
