import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function CategoriesPage() {
  const [cats, setCats] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [form, setForm] = useState({ name: "", subtitle: "", description: "", displayOrder: 1, isActive: true });
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getAdminCategories().then((c) => {
      setCats(c);
      if (!selected && c.length > 0) setSelected(c[0].id);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const c = cats.find((x) => x.id === selected);
    if (c) setForm({ name: c.name, subtitle: c.subtitle || "", description: c.description || "", displayOrder: c.displayOrder || 1, isActive: c.isActive !== false });
  }, [selected, cats]);

  const handleSave = async () => {
    try {
      await api.updateCategory(selected, form);
      setToast("Category saved.");
      load();
    } catch (err: any) { setToast("Error: " + err.message); }
  };

  const activeCat = cats.find((x) => x.id === selected);
  const gradeCount = (catId: string) => "—";

  if (loading) return <div className="spinner" style={{ margin: "40px auto" }} />;

  return (
    <div>
      <div className="section-head">
        <div><span className="eyebrow">Catalogue structure</span><h2>Tea categories.</h2></div>
        <p>Maintain the category layer shown across the public tea finder: Black, Green and Specialty.</p>
      </div>

      <div className="category-layout">
        <div className="category-list">
          {cats.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map((c) => (
            <button key={c.id} className={`category-item ${selected === c.id ? "active" : ""}`} onClick={() => setSelected(c.id)}>
              <span className="count">{gradeCount(c.id)}</span>
              <strong>{c.name}</strong>
              <span>{c.subtitle}</span>
            </button>
          ))}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><h2>{activeCat?.name || "Category"}</h2><p>{activeCat ? `${cats.indexOf(activeCat) + 1} of ${cats.length} categories · category settings` : "Category settings"}</p></div>
            <button className="btn gold" onClick={handleSave}>Save category</button>
          </div>
          <div className="panel-body">
            <div className="detail-grid">
              <div className="field-group"><label>Category name</label><input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="field-group"><label>Public subtitle</label><input className="field" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
              <div className="field-group full"><label>Description</label><textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="field-group"><label>Display order</label><input className="field" type="number" min="1" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} /></div>
              <div className="field-group"><label>Visible on public site</label><br />
                <label style={{ position: "relative", display: "inline-block", width: 42, height: 23, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: "absolute", inset: 0, borderRadius: 99, background: form.isActive ? "#3f7b59" : "#cdd2ce", transition: ".2s" }}>
                    <span style={{ position: "absolute", width: 17, height: 17, left: form.isActive ? 22 : 3, top: 3, background: "#fff", borderRadius: "50%", transition: ".2s", boxShadow: "0 2px 5px rgba(0,0,0,.12)" }} />
                  </span>
                </label>
              </div>
            </div>
            <div className="form-note" style={{ marginTop: 13 }}>Category edits affect the public tea finder labels. Individual grade prices remain managed from the Tea Catalogue.</div>
          </div>
        </div>
      </div>

      {toast && <div className="toast show" style={{ position: "fixed", right: 20, bottom: 20, zIndex: 150, background: "var(--ink)", color: "#fff", padding: "12px 15px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>{toast}</div>}
    </div>
  );
}
