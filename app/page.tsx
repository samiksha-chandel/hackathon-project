'use client'
import { useState, ReactNode } from 'react'
import { LayoutDashboard, Boxes, HeartPulse, TrendingUp, MapPin, Store, FlaskConical, Inbox, Gauge, Landmark, BatteryCharging, CheckCircle2, Factory, Recycle, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Provider, useApp, Role } from '@/lib/store'
import { OEMS, RECYCLERS } from '@/lib/logic'
import { Overview, Batches, Health, Forecast, Recyclers, Market, Materials } from '@/components/oem'
import { RDash, Opps, Capacity, Regulator } from '@/components/others'
import { Sel, cn } from '@/components/ui'

const NAV: Record<Role, [string, string, any][]> = {
  oem: [['overview', 'Overview', LayoutDashboard], ['batches', 'Inventory & traceability', Boxes], ['health', 'Health, RUL & score', HeartPulse], ['forecast', 'EoL waste forecast', TrendingUp], ['recyclers', 'Recycler discovery', MapPin], ['market', 'Marketplace', Store], ['materials', 'Material recovery', FlaskConical]],
  recycler: [['rdash', 'Dashboard', LayoutDashboard], ['opps', 'EoL opportunities', Inbox], ['cap', 'Capacity & chemistry', Gauge]],
  regulator: [['reg', 'Inspection view', Landmark]],
}
const ROLES: [Role, string, any][] = [['oem', 'OEM', Factory], ['recycler', 'Recycler', Recycle], ['regulator', 'Regulator', Landmark]]
const START: Record<Role, string> = { oem: 'overview', recycler: 'rdash', regulator: 'reg' }

function Shell() {
  const { s, d } = useApp(); const [view, setView] = useState('overview'); const [open, setOpen] = useState(true)
  const go = (v: string) => setView(v)
  const role = (r: Role) => { d({ t: 'role', v: r }); setView(START[r]) }
  const V: Record<string, ReactNode> = { overview: <Overview goto={go} />, batches: <Batches goto={go} />, health: <Health />, forecast: <Forecast />, recyclers: <Recyclers />, market: <Market />, materials: <Materials />, rdash: <RDash goto={go} />, opps: <Opps />, cap: <Capacity />, reg: <Regulator /> }
  return <div className="flex min-h-screen">
    <aside className={cn('sticky top-0 flex h-screen shrink-0 flex-col bg-navy py-5 border-r border-white/10 text-stone-300 transition-[width] duration-200', open ? 'w-60 px-4' : 'w-[72px] px-3')}>
      <div className={cn('mb-8 flex items-center', open ? 'justify-between px-1' : 'flex-col gap-4')}>
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand text-white"><BatteryCharging size={18} /></div>
          {open && <div className="leading-tight"><div className="font-display text-[15px] font-semibold text-white">Battery EPR</div><div className="text-[11px] text-stone-500">Intelligence Platform</div></div>}
        </div>
        <button onClick={() => setOpen(o => !o)} aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={open} title={open ? 'Collapse sidebar' : 'Expand sidebar'} className="grid h-8 w-8 place-items-center rounded-md text-stone-400 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-bright">{open ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}</button>
      </div>
      <nav aria-label="Role" className="space-y-1">{ROLES.map(([r, l, I]) => { const on = s.role === r; return <button key={r} onClick={() => role(r)} title={l} aria-current={on ? 'page' : undefined} className={cn('relative flex w-full items-center gap-3 rounded-lg py-2.5 text-[14px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-bright', open ? 'px-3' : 'justify-center', on ? 'bg-white/[0.08] text-white' : 'text-stone-400 hover:bg-white/5 hover:text-white')}>{on && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-brand-bright" />}<I size={18} className="shrink-0" />{open && l}</button> })}</nav>
      {open && <div className="mt-auto rounded-lg border border-white/10 p-3 text-[11px] leading-relaxed text-stone-500">Prototype · mock data derived from SIH dataset. Traceability flows OEM → recycler → regulator.</div>}
    </aside>
    <main className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex flex-wrap items-stretch justify-between gap-x-6 gap-y-2 border-b border-white/10 bg-navy px-6 text-stone-300 shadow-[0_6px_20px_-12px_rgba(13,16,14,.6)]">
        <nav aria-label="Pages" className="flex min-w-0 flex-1 flex-wrap gap-1 pt-2">{NAV[s.role].map(([k, l, I]) => { const on = view === k; return <button key={k} onClick={() => go(k)} aria-current={on ? 'page' : undefined} className={cn('relative flex min-w-[110px] max-w-[190px] flex-1 items-center gap-2.5 rounded-t-lg px-3.5 pb-3 pt-2.5 text-left text-[13px] font-medium leading-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-bright', on ? 'bg-white/[0.1] text-white' : 'text-stone-400 hover:bg-white/5 hover:text-white')}><I size={16} className={cn('shrink-0', on && 'text-brand-bright')} /><span>{l}</span>{on && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t bg-brand-bright" />}</button> })}</nav>
        <div className="flex shrink-0 items-center gap-3 py-2 text-[13px]"><span className="text-stone-400">Viewing as</span>{s.role === 'oem' && <Sel value={s.oem} onChange={v => d({ t: 'oem', v })} opts={OEMS} />}{s.role === 'recycler' && <select value={s.rid} onChange={e => d({ t: 'rid', v: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-ink">{RECYCLERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>}{s.role === 'regulator' && <b className="text-white">SPCB / CPCB</b>}</div>
      </header>
      <div className="mx-auto max-w-[1180px] p-8">{V[view]}</div>
    </main>
    {s.toast && <div className="rise fixed bottom-6 right-6 flex items-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-medium text-white shadow-xl"><CheckCircle2 size={16} className="text-brand-bright" />{s.toast}</div>}
  </div>
}
export default function Page() { return <Provider><Shell /></Provider> }
