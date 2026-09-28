import raw from './data.json'
export const YEAR = 2026
export const FY = { label: 'FY 2026-27', target: 90 }
export const TARGETS = [['FY 2024-25', 70], ['FY 2025-26', 80], ['FY 2026-27', 90]] as const
export const REGIONS = ['North', 'West', 'South', 'East']
export type Recycler = (typeof raw.recyclers)[number]
const LFP_LIKE = ['Lithium-iron phosphate', 'Lithium-titanate', 'Aluminum-ion']
const NMC_LIKE = ['Calcium-ion', 'Nickel-manganese-cobalt', 'Nickel-cobalt-aluminum']
// Scoring per project document: score = max(0, min(100, base + bonus + penalty)); RUL% = max(0, 100*(1-degradation))
export function enrich(b: (typeof raw.batches)[number]) {
  const age = YEAR - b.my
  const rul = Math.max(0, 100 * (1 - b.rate))
  const base = rul > 90 ? 50 : rul >= 80 ? 40 : rul >= 70 ? 30 : rul >= 60 ? 20 : 0
  const bonus = LFP_LIKE.includes(b.chem) ? 20 : NMC_LIKE.includes(b.chem) ? 10 : 0
  const pen = age <= 3 ? 0 : age <= 6 ? -10 : age <= 10 ? -20 : -30
  const score = Math.max(0, Math.min(100, base + bonus + pen))
  const totalKg = b.units * b.unitKg
  const status = b.eolYear <= YEAR ? 'EoL reached' : b.eolYear <= YEAR + 2 ? 'EoL soon' : 'In service'
  return { ...b, age, rul, base, bonus, pen, score, totalKg, status }
}
export type Batch = ReturnType<typeof enrich>
export const BATCHES: Batch[] = raw.batches.map(enrich)
export const RECYCLERS = raw.recyclers
export const OEMS = raw.oems
export const isDue = (b: Batch) => b.eolYear <= YEAR + 1
export const materialsOf = (b: Batch, recovery = 85) =>
  Object.entries(b.mats).map(([m, f]) => {
    const kg = b.totalKg * (f as number) * (recovery / 100)
    return { m, kg, value: kg * (raw.prices as Record<string, number>)[m] }
  })
export const valueOf = (b: Batch, recovery = 85) => materialsOf(b, recovery).reduce((s, x) => s + x.value, 0)
export const suitable = (b: Batch) => RECYCLERS.filter(r => r.chems.includes(b.chem))
export const t = (kg: number) => (kg / 1000).toLocaleString('en-IN', { maximumFractionDigits: 0 })
export const inr = (v: number) => v >= 1e7 ? `₹${(v / 1e7).toFixed(2)} Cr` : v >= 1e5 ? `₹${(v / 1e5).toFixed(1)} L` : `₹${Math.round(v).toLocaleString('en-IN')}`
export const tone = (s: string) => s === 'EoL reached' ? 'red' : s === 'EoL soon' ? 'amber' : 'green'
