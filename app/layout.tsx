import './globals.css'
import { Instrument_Sans, Bricolage_Grotesque } from 'next/font/google'
const f = Instrument_Sans({ subsets:['latin'], variable:'--font-sans' })
const g = Bricolage_Grotesque({ subsets:['latin'], variable:'--font-display' })
export const metadata = { title:'Battery EPR Intelligence Platform' }
export default function L({ children }:{ children:React.ReactNode }) { return <html lang="en"><body className={f.variable + ' ' + g.variable + ' font-sans'}>{children}</body></html> }
