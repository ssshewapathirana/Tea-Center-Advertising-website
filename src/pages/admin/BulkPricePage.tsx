import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { rs } from "../../lib/utils";

export default function BulkPricePage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [operation, setOperation] = useState("increase_percent");
  const [value, setValue] = useState(3);
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getAdminPrices().then(setPrices).finally(() => setLoading(false)); }, []);

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => setSelected(new Set(prices.map((p) => p.teaGradeId)));

  useEffect(() => {
    const p = prices.filter((x) => selected.has(x.teaGradeId)).map((x) => {
      const cur = Number(x.pricePerKg);
      let newP: number;
      switch (operation) {
        case "increase_percent": newP = cur * (1 + value / 100); break;
        case "decrease_percent": newP = cur * (1 - value / 100); break;
        case "increase_fixed": newP = cur + value; break;
        case "decrease_fixed": newP = cur - value; break;
        default: newP = cur;
      }
      return { ...x, previousPrice: cur, newPrice: Math.max(0, Math.round(newP * 100) / 100), pctChange: cur > 0 ? ((newP - cur) / cur * 100) : 0 };
    });
    setPreview(p);
  }, [selected, operation, value, prices]);

  const handleBulk = async () => {
    try {
      await api.bulkUpdatePrices({ teaGradeIds: [...selected], operation, value, reason });
      setToast(`Updated ${selected.size} tea prices.`);
      setSelected(new Set()); setReason("");
    } catch (err: any) { setToast("Error: " + err.message); }
  };

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, marginBottom: 24 }}>Bulk Price Update</h1>
      <div className="paper-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <button className="btn btn-outline btn-sm" onClick={selectAll}>Select all</button>
          <button className="btn btn-outline btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
          <span style={{ fontSize: 13, color: "var(--muted)", alignSelf: "center" }}>{selected.size} selected</span>
        </div>
        <div className="grid-3" style={{ marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Operation</label>
            <select className="select" value={operation} onChange={(e) => setOperation(e.target.value)}>
              <option value="increase_percent">Increase by %</option>
              <option value="decrease_percent">Decrease by %</option>
              <option value="increase_fixed">Increase by fixed LKR</option>
              <option value="decrease_fixed">Decrease by fixed LKR</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Value</label>
            <input className="input" type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Reason</label>
            <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        {preview.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, marginBottom: 8 }}>Preview</h4>
            <div className="paper-card" style={{ overflow: "hidden" }}>
              <table className="table">
                <thead><tr><th>Grade</th><th>Current</th><th>New</th><th>Change</th></tr></thead>
                <tbody>
                  {preview.map((p) => (
                    <tr key={p.teaGradeId}>
                      <td><strong>{p.gradeCode}</strong></td>
                      <td>{rs(p.previousPrice)}</td>
                      <td style={{ fontWeight: 600 }}>{rs(p.newPrice)}</td>
                      <td style={{ color: p.pctChange >= 0 ? "var(--ok)" : "var(--danger)" }}>{p.pctChange >= 0 ? "+" : ""}{p.pctChange.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <button className="btn btn-primary" onClick={handleBulk} disabled={selected.size === 0}>
          Update {selected.size} tea{selected.size !== 1 ? "s" : ""}
        </button>
      </div>
      {toast && <div className={`toast ${toast.startsWith("Error") ? "toast-error" : "toast-success"}`}>{toast}</div>}
    </div>
  );
}
