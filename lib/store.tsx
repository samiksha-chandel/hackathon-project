'use client'
import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { BATCHES, RECYCLERS, isDue, suitable, FY } from './logic'
export type Role = 'oem' | 'recycler' | 'regulator'
export type Listing = { status: 'open' | 'matched'; interests: { rid: string; price: number; note: string }[]; matched?: string }
type S = { role: Role; oem: string; rid: string; listings: Record<string, Listing>; toast: string }
type A = { t: 'role'; v: Role } | { t: 'oem'; v: string } | { t: 'rid'; v: string } | { t: 'list'; id: string }
  | { t: 'interest'; id: string; rid: string; price: number; note: string } | { t: 'accept'; id: string; rid: string } | { t: 'clear' }
const seed = (): Record<string, Listing> => {
  const l: Record<string, Listing> = {}
  BATCHES.filter(b => b.eolYear <= 2028).forEach((b, i) => {
    l[b.id] = { status: 'open', interests: [] }
    suitable(b).slice(0, i % 3).forEach((r, j) => l[b.id].interests.push({ rid: r.id, price: 38 + j * 4 + i, note: 'Can collect within 3 weeks.' }))
  })
  return l
}
const init: S = { role: 'oem', oem: 'Tata Motors', rid: 'R1', listings: seed(), toast: '' }
function reduce(s: S, a: A): S {
  switch (a.t) {
    case 'role': return { ...s, role: a.v }
    case 'oem': return { ...s, oem: a.v }
    case 'rid': return { ...s, rid: a.v }
    case 'list': return { ...s, toast: 'Batch listed on marketplace', listings: { ...s.listings, [a.id]: s.listings[a.id] ?? { status: 'open', interests: [] } } }
    case 'interest': { const l = s.listings[a.id]; return { ...s, toast: 'Interest submitted to OEM', listings: { ...s.listings, [a.id]: { ...l, interests: [...l.interests.filter(i => i.rid !== a.rid), { rid: a.rid, price: a.price, note: a.note }] } } } }
    case 'accept': return { ...s, toast: 'Recycler matched — recovery credited to EPR', listings: { ...s.listings, [a.id]: { ...s.listings[a.id], status: 'matched', matched: a.rid } } }
    case 'clear': return { ...s, toast: '' }
  }
}
const Ctx = createContext<{ s: S; d: (a: A) => void }>(null as never)
export const useApp = () => useContext(Ctx)
export function Provider({ children }: { children: ReactNode }) {
  const [s, d] = useReducer(reduce, init)
  useEffect(() => { if (s.toast) { const x = setTimeout(() => d({ t: 'clear' }), 2600); return () => clearTimeout(x) } }, [s.toast])
  return <Ctx.Provider value={{ s, d }}>{children}</Ctx.Provider>
}
// EPR: obligation = target% of batches at/near EoL; fulfilled = matched marketplace batches + previously certified share
export function epr(s: S, oem: string) {
  const due = BATCHES.filter(b => b.oem === oem && isDue(b))
  const obligation = due.reduce((a, b) => a + b.totalKg, 0) * FY.target / 100
  const records = due.filter(b => s.listings[b.id]?.status === 'matched').map(b => ({ b, r: RECYCLERS.find(r => r.id === s.listings[b.id].matched)! }))
  const done = records.reduce((a, x) => a + x.b.totalKg, 0)
  const certified = obligation * 0.3
  const fulfilled = Math.min(obligation, certified + done)
  return { due, obligation, fulfilled, certified, gap: Math.max(0, obligation - fulfilled), pct: obligation ? (fulfilled / obligation) * 100 : 100, records }
}
