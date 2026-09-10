import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { rs, formatDate } from "../../lib/utils";

export default function PriceHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getPriceHistory().then(setHistory).finally(() => setLoading(false)); }, []);

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, marginBottom: 24 }}>Price History</h1>
      {loading ? <div className="spinner" style={{ margin: "40px auto" }} /> : (
        <div className="paper-card" style={{ overflow: "hidden" }}>
          <table className="table">
            <thead><tr><th>Tea</th><th>Old Price</th><th>New Price</th><th>Change</th><th>Date</th><th>Changed By</th><th>Reason</th></tr></thead>
            <tbody>
              {history.map((h: any) => (
                <tr key={h.id}>
                  <td><strong>{h.gradeCode}</strong><div style={{ fontSize: 12, color: "var(--muted)" }}>{h.teaName}</div></td>
                  <td>{rs(Number(h.oldPrice))}</td>
                  <td style={{ fontWeight: 600 }}>{rs(Number(h.newPrice))}</td>
                  <td style={{ color: Number(h.percentageChange) >= 0 ? "var(--ok)" : "var(--danger)" }}>
                    {Number(h.percentageChange) >= 0 ? "↑" : "↓"} {Math.abs(Number(h.percentageChange)).toFixed(2)}%
                  </td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{formatDate(h.effectiveFrom || h.createdAt)}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{h.changedBy || "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{h.reason || "—"}</td>
                </tr>
              ))}
              {history.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>No price history yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
