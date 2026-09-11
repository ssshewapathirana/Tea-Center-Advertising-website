import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { rs } from "../../lib/utils";

export default function PricesPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [teaId, setTeaId] = useState("");
  const [newPrice, setNewPrice] = useState(0);
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState("");

  const load = () => { api.getAdminPrices().then(setPrices); };
  useEffect(() => { load(); }, []);

  const selected = prices.find((p) => p.teaGradeId === teaId);

  const handleUpdate = async () => {
    if (!teaId || !newPrice) return;
    try {
      const result = await api.updatePrice({ teaGradeId: teaId, newPrice, reason });
      setToast(`Price updated: Rs. ${result.previousPrice} → Rs. ${result.newPrice} (${result.percentageChange >= 0 ? "+" : ""}${result.percentageChange.toFixed(2)}%)`);
      setTeaId(""); setNewPrice(0); setReason("");
      load();
    } catch (err: any) { setToast("Error: " + err.message); }
  };

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, marginBottom: 24 }}>Price Management</h1>
      <div className="paper-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Update Price</h3>
        <div className="grid-3" style={{ marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Tea Grade</label>
            <select className="select" value={teaId} onChange={(e) => { setTeaId(e.target.value); const p = prices.find((p) => p.teaGradeId === e.target.value); if (p) setNewPrice(Number(p.pricePerKg)); }}>
              <option value="">Select tea</option>
              {prices.map((p) => <option key={p.teaGradeId} value={p.teaGradeId}>{p.gradeCode} — {p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>New Price (LKR/kg)</label>
            <input className="input" type="number" value={newPrice || ""} onChange={(e) => setNewPrice(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Reason</label>
            <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        {selected && newPrice > 0 && (
          <div style={{ background: "var(--soft)", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid var(--line)" }}>
            <span>{rs(Number(selected.pricePerKg))} → {rs(newPrice)}</span>
            <span style={{ marginLeft: 12, color: newPrice >= Number(selected.pricePerKg) ? "var(--ok)" : "var(--danger)" }}>
              {newPrice >= Number(selected.pricePerKg) ? "↑" : "↓"} {Math.abs(((newPrice - Number(selected.pricePerKg)) / Number(selected.pricePerKg)) * 100).toFixed(2)}%
            </span>
          </div>
        )}
        <button className="btn btn-primary" onClick={handleUpdate} disabled={!teaId || !newPrice}>Update Price</button>
      </div>
      <h3 style={{ fontSize: 16, marginBottom: 12 }}>Current Prices</h3>
      <div className="paper-card" style={{ overflow: "hidden" }}>
        <table className="table">
          <thead><tr><th>Grade</th><th>Name</th><th>Price/kg</th><th>Currency</th></tr></thead>
          <tbody>
            {prices.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.gradeCode}</strong></td>
                <td>{p.name}</td>
                <td style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>{rs(Number(p.pricePerKg))}</td>
                <td>{p.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {toast && <div className={`toast ${toast.startsWith("Error") ? "toast-error" : "toast-success"}`}>{toast}</div>}
    </div>
  );
}
