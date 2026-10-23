import { read as readXlsx } from "xlsx";

// Legge il file "Calcolo pallet 3 settimane": data inizio (B3), pallet di partenza (C8 o B4),
// righe 8-28 con lavorati notte (D), lavorati mattina (E), ricevuti (G) e note (I).
export function parsePallet(buf) {
  const wb = readXlsx(buf, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const v = a => { const c = ws && ws[a]; return c ? c.v : undefined; };
  const isNum = x => typeof x === "number" && isFinite(x);
  const pad = n => String(n).padStart(2, "0");
  const fmt = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const s = v("B3");
  if (!(s instanceof Date)) throw new Error("no_start");
  const start = new Date(s.getTime() + 12 * 3600e3); start.setHours(12, 0, 0, 0);
  const initial = isNum(v("C8")) ? v("C8") : (isNum(v("B4")) ? v("B4") : 0);
  const days = {};
  for (let i = 0; i < 21; i++) {
    const r = 8 + i, d = new Date(start.getTime() + i * 864e5);
    const x = {};
    if (isNum(v("D" + r))) x.n = v("D" + r);
    if (isNum(v("E" + r))) x.m = v("E" + r);
    if (isNum(v("G" + r))) x.r = v("G" + r);
    const note = v("I" + r); if (note != null && String(note).trim()) x.note = String(note).trim();
    if (Object.keys(x).length) days[fmt(d)] = x;
  }
  const notes = [v("I4"), v("I3"), v("I5")].filter(x => x != null && String(x).trim()).map(String).join(" · ");
  return { start: fmt(start), initial, note: notes, days };
}
