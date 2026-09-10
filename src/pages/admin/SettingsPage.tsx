import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    currency: "LKR",
    basis: "Indicative ex-factory average / kg",
    cadence: "Weekly",
    date: "2026-09-01",
    disclaimer: "Prices are indicative ex-factory averages per kilogram. Actual market values vary by grade, quality, date and sale basis.",
  });
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSettings().then((s: any) => {
      if (s) setSettings((prev) => ({ ...prev, ...s }));
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await api.updateSettings(settings);
      setToast("Settings saved.");
    } catch (err: any) { setToast("Error: " + err.message); }
  };

  if (loading) return <div className="spinner" style={{ margin: "40px auto" }} />;

  return (
    <div>
      <div className="section-head">
        <div><span className="eyebrow">Control settings</span><h2>Catalogue rules.</h2></div>
        <p>Define how prices are represented and how the public interface describes the market feed.</p>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div><h2>Price display</h2><p>Settings used by the admin panel</p></div>
          <button className="btn gold" onClick={handleSave}>Save settings</button>
        </div>
        <div className="panel-body">
          <div className="detail-grid">
            <div className="field-group">
              <label>Currency</label>
              <select className="field" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}>
                <option>LKR</option>
              </select>
            </div>
            <div className="field-group">
              <label>Price basis</label>
              <select className="field" value={settings.basis} onChange={(e) => setSettings({ ...settings, basis: e.target.value })}>
                <option>Indicative ex-factory average / kg</option>
                <option>Actual factory price / kg</option>
                <option>Auction average / kg</option>
              </select>
            </div>
            <div className="field-group">
              <label>Update cadence</label>
              <select className="field" value={settings.cadence} onChange={(e) => setSettings({ ...settings, cadence: e.target.value })}>
                <option>Weekly</option>
                <option>Daily</option>
                <option>Manual</option>
              </select>
            </div>
            <div className="field-group">
              <label>Effective date</label>
              <input className="field" type="date" value={settings.date} onChange={(e) => setSettings({ ...settings, date: e.target.value })} />
            </div>
            <div className="field-group full">
              <label>Public price disclaimer</label>
              <textarea className="textarea" value={settings.disclaimer} onChange={(e) => setSettings({ ...settings, disclaimer: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="toast show" style={{ position: "fixed", right: 20, bottom: 20, zIndex: 150, background: "var(--ink)", color: "#fff", padding: "12px 15px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>{toast}</div>}
    </div>
  );
}
