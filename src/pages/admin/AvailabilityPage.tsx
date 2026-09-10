import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { availabilityLabel, availabilityClass } from "../../lib/utils";

export default function AvailabilityPage() {
  const [tea, setTea] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const load = () => { setLoading(true); api.getAdminTea().then(setTea).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleChange = async (id: string, avail: string) => {
    try {
      await api.updateAvailability(id, avail);
      setToast("Availability updated.");
      load();
    } catch (err: any) { setToast("Error: " + err.message); }
  };

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, marginBottom: 24 }}>Availability Management</h1>
      {loading ? <div className="spinner" style={{ margin: "40px auto" }} /> : (
        <div className="paper-card" style={{ overflow: "hidden" }}>
          <table className="table">
            <thead><tr><th>Grade</th><th>Category</th><th>Price</th><th>Availability</th><th>Action</th></tr></thead>
            <tbody>
              {tea.map((t: any) => (
                <tr key={t.id}>
                  <td><strong>{t.gradeCode}</strong><div style={{ fontSize: 12, color: "var(--muted)" }}>{t.name}</div></td>
                  <td>{t.categoryName}</td>
                  <td>{t.pricePerKg ? `Rs. ${Number(t.pricePerKg).toLocaleString()}` : "—"}</td>
                  <td><span className={`badge ${availabilityClass(t.availability)}`}>{availabilityLabel(t.availability)}</span></td>
                  <td>
                    <select className="select" value={t.availability} onChange={(e) => handleChange(t.id, e.target.value)} style={{ width: 140, padding: "6px 10px", fontSize: 12 }}>
                      <option value="AVAILABLE">Available</option>
                      <option value="LOW_STOCK">Low stock</option>
                      <option value="OUT_OF_STOCK">Out of stock</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {toast && <div className={`toast ${toast.startsWith("Error") ? "toast-error" : "toast-success"}`}>{toast}</div>}
    </div>
  );
}
