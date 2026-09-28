# Battery EPR Intelligence Platform — frontend prototype
`npm install && npm run dev` → http://localhost:3000
Demo journey: OEM Overview → open an EoL batch → traceability/suitable recyclers → Marketplace → switch role to Recycler → Opportunities → Submit interest → switch back to OEM → Accept match → Material recovery updates → Regulator view shows the record.
Data: `lib/data.json` (normalized from SIH.xlsx). Scoring/RUL formulas: `lib/logic.ts`. Assumed (not in document): energy density, degradation rates, design life, material yields, prices, recycler profiles.
