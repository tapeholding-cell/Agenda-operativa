import { read as readXlsx } from "xlsx";

// Legge il file Excel "UPT TOOL" (fogli D1, D2-D4, D7, D15, D16, Casse, Ordine, Dashboard).
const UPT_CROSS = ["D1", "D2-D4", "D7", "D15", "D16", "Casse"];
export function parseUpt(buf) {
  const wb = readXlsx(buf, { type: "array", cellDates: true });
  const v = (ws, a) => { const c = ws && ws[a]; return c ? c.v : undefined; };
  const n = x => { const k = Number(x); return isFinite(k) ? k : 0; };
  const t = x => (x == null ? "" : String(x).trim());
  const ord = wb.Sheets["Ordine"], dash = wb.Sheets["Dashboard"];
  const products = [];
  UPT_CROSS.forEach((x, k) => {
    const ws = wb.Sheets[x]; if (!ws) return;
    for (let r = 4; r <= 53; r++) {
      const name = t(v(ws, "C" + r)), kim = t(v(ws, "B" + r));
      if (!name && !kim) continue;
      const o = 5 + k * 50 + (r - 4);
      products.push({ cross: x, ord: r - 3, kimball: kim, name, color: t(v(ws, "D" + r)), pos: t(v(ws, "E" + r)),
        qRep: n(v(ws, "F" + r)), qCross: n(v(ws, "G" + r)), tipo: v(ws, "I" + r) === "Stagionale" ? "Stagionale" : "Continuativo",
        stock: n(v(ord, "I" + o)), s4: n(v(ord, "J" + o)), s3: n(v(ord, "K" + o)), s2: n(v(ord, "L" + o)), s1: n(v(ord, "M" + o)) });
    }
  });
  if (!wb.Sheets["D1"] && !wb.Sheets["D2-D4"]) throw new Error("not_upt");
  const a = v(ord, "H2"); let arrival = "";
  if (a instanceof Date) { const d = new Date(a.getTime() + 12 * 3600e3); arrival = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  const space = {}; UPT_CROSS.forEach((x, k) => { space[x] = { rep: n(v(dash, "B" + (38 + k))), cross: n(v(dash, "C" + (38 + k))) }; });
  const cfg = { arrival, scorta: dash ? n(v(dash, "B2")) : 20, wknd: dash ? n(v(dash, "E2")) : 30,
    upAll: n(v(dash, "B3")), upS: n(v(dash, "E3")), upC: n(v(dash, "H3")), space };
  return { products, cfg };
}

