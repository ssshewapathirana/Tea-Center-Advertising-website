import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { rs } from "../../lib/utils";

export default function TeaCataloguePage() {
  const [tea, setTea] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([api.getAdminTea(), api.getAdminCategories()])
      .then(([t, c]) => { setTea(t); setCategories(c); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = tea.filter((t) => {
    if (catFilter !== "All" && t.categoryId !== catFilter) return false;
    if (statusFilter !== "all") {
      if (statusFilter === "published" && !t.isPublished) return false;
      if (statusFilter === "draft" && t.isPublished) return false;
    }
    if (stockFilter !== "all" && (t.availability || "AVAILABLE") !== stockFilter.toUpperCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(t.gradeCode + " " + t.name + " " + t.processingMethod + " " + t.categoryName).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((t) => t.id)));
  };

  const handleBulk = async (pct: number) => {
    if (selected.size === 0) { setToast("Select grades first."); return; }
    for (const id of selected) {
      const t = tea.find((x) => x.id === id);
      if (t && t.pricePerKg) {
        const newPrice = Math.round(Number(t.pricePerKg) * (1 + pct / 100) / 10) * 10;
        await api.updatePrice({ teaGradeId: id, newPrice, reason: `Bulk ${pct > 0 ? "+" : ""}${pct}%` });
      }
    }
    setToast(`Updated ${selected.size} prices.`);
    setSelected(new Set());
    load();
  };

  const handleAvail = async (id: string, avail: string) => {
    await api.updateAvailability(id, avail);
    load();
  };

  const handlePublish = async (id: string, pub: boolean) => {
    await api.updatePublish(id, pub);
    load();
  };

  const openEdit = async (t: any) => {
    try {
      const fresh = await api.getAdminTeaById(t.id);
      setEditing({
        id: fresh.id,
        gradeCode: fresh.gradeCode || "",
        name: fresh.name || "",
        categoryId: fresh.categoryId || "",
        categoryName: fresh.categoryName || "",
        processingMethod: fresh.processingMethod || "Orthodox",
        groupName: fresh.groupName || "",
        description: fresh.description || "",
        tasteProfile: fresh.tasteProfile || "",
        cupColour: fresh.cupColour || "",
        bestFor: fresh.bestFor || "",
        availability: fresh.availability || "AVAILABLE",
        isPublished: fresh.isPublished ?? true,
        displayOrder: fresh.displayOrder || 0,
        pricePerKg: fresh.pricePerKg ? Number(fresh.pricePerKg) : 0,
        effectiveDate: fresh.effectiveDate || new Date().toISOString().slice(0, 10),
      });
    } catch {
      setEditing({
        id: t.id, gradeCode: t.gradeCode || "", name: t.name || "", categoryId: t.categoryId || "",
        categoryName: t.categoryName || "", processingMethod: t.processingMethod || "Orthodox",
        groupName: t.groupName || "", description: t.description || "", tasteProfile: t.tasteProfile || "",
        cupColour: t.cupColour || "", bestFor: t.bestFor || "", availability: t.availability || "AVAILABLE",
        isPublished: t.isPublished ?? true, displayOrder: t.displayOrder || 0,
        pricePerKg: t.pricePerKg ? Number(t.pricePerKg) : 0,
        effectiveDate: t.effectiveDate || new Date().toISOString().slice(0, 10),
      });
    }
    setShowModal(true);
  };

  const openAdd = () => {
    setEditing({
      id: null, gradeCode: "", name: "", categoryId: categories[0]?.id || "", categoryName: categories[0]?.name || "",
      processingMethod: "Orthodox", groupName: "Orthodox", description: "", tasteProfile: "", cupColour: "",
      bestFor: "", availability: "AVAILABLE", isPublished: false, displayOrder: 1, pricePerKg: 1000,
      effectiveDate: new Date().toISOString().slice(0, 10),
    });
    setShowModal(true);
  };

  const handleSaveModal = async () => {
    if (!editing) return;
    try {
      if (editing.id) {
        await api.updateTea(editing.id, {
          gradeCode: editing.gradeCode, name: editing.name, categoryId: editing.categoryId,
          processingMethod: editing.processingMethod, groupName: editing.groupName,
          description: editing.description, tasteProfile: editing.tasteProfile,
          cupColour: editing.cupColour, bestFor: editing.bestFor,
          availability: editing.availability, isPublished: editing.isPublished,
          displayOrder: editing.displayOrder,
        });
        if (editing.pricePerKg > 0) {
          await api.updatePrice({ teaGradeId: editing.id, newPrice: editing.pricePerKg, reason: "Admin edit" });
        }
        setToast("Grade updated.");
      } else {
        await api.createTea({ ...editing, initialPrice: editing.pricePerKg });
        setToast("New grade created.");
      }
      setShowModal(false);
      load();
    } catch (err: any) { setToast("Error: " + err.message); }
  };

  const stockBadge = (t: any) => {
    const st = (t.availability || "AVAILABLE").toLowerCase();
    if (st === "out_of_stock") return <span className="stock out"><span className="stock-dot" />Out of stock</span>;
    if (st === "low_stock") return <span className="stock low"><span className="stock-dot" />Low stock</span>;
    return <span className="stock avail"><span className="stock-dot" />Available</span>;
  };

  const updateField = (field: string, value: any) => setEditing((prev: any) => ({ ...prev, [field]: value }));

  return (
    <div>
      <div className="section-head">
        <div><span className="eyebrow">Tea catalogue</span><h2>Grades &amp; prices.</h2></div>
        <p>Search, filter, edit or disable individual grades. Price changes are recorded with date and administrator information.</p>
      </div>

      <div className="toolbar">
        <input className="search" placeholder="Search grade, note or method…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select className="select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
          <option value="all">All availability</option>
          <option value="available">Available</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <button className="btn" onClick={openAdd}>＋ Add grade</button>
      </div>

      <div className="category-tabs">
        <button className={`cat-btn ${catFilter === "All" ? "active" : ""}`} onClick={() => setCatFilter("All")}>All grades</button>
        {categories.filter((c) => c.isActive !== false).sort((a, b) => a.displayOrder - b.displayOrder).map((c) => (
          <button key={c.id} className={`cat-btn ${catFilter === c.id ? "active" : ""}`} onClick={() => setCatFilter(c.id)}>{c.name}</button>
        ))}
      </div>

      <div className="bulk-bar">
        <span>{selected.size} grade{selected.size !== 1 ? "s" : ""} selected</span>
        <div className="bulk-actions">
          <button className="btn" onClick={() => handleBulk(1)}>+ 1%</button>
          <button className="btn" onClick={() => handleBulk(-1)}>− 1%</button>
          <button className="btn" onClick={() => handleBulk(5)}>+ 5%</button>
          <button className="btn" onClick={() => handleBulk(-5)}>− 5%</button>
          <button className="btn" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      </div>

      {loading ? <div className="spinner" style={{ margin: "40px auto" }} /> : (
        <div className="panel catalog-panel">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                <th>Grade</th><th>Category</th><th>Method</th><th>Price / kg</th><th>Change</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td><input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} /></td>
                  <td><span className="grade-name">{t.gradeCode}</span><div className="grade-sub">{t.name}</div></td>
                  <td>{t.categoryName}</td>
                  <td><span className="tag">{t.processingMethod}</span></td>
                  <td><span className="price">{t.pricePerKg ? rs(Number(t.pricePerKg)) : "—"}</span><span className="price-unit"> /kg</span></td>
                  <td><span style={{ fontWeight: 850, color: "var(--muted)" }}>—</span></td>
                  <td>{stockBadge(t)}</td>
                  <td><span className={`status ${t.isPublished ? "" : "draft"}`}>{t.isPublished ? "Published" : "Draft"}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" title="Edit" onClick={() => openEdit(t)}>✎</button>
                      <button className="icon-btn" title="Toggle availability" onClick={() => handleAvail(t.id, t.availability === "OUT_OF_STOCK" ? "AVAILABLE" : "OUT_OF_STOCK")}>◉</button>
                      <button className="icon-btn" title="Toggle visibility" onClick={() => handlePublish(t.id, !t.isPublished)}>◌</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9}><div className="empty">No matching tea grades.</div></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && editing && (
        <div className="modal-backdrop open" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editing.id ? `Edit ${editing.gradeCode}` : "Add new tea grade"}</h3>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="field-group">
                  <label>Grade code</label>
                  <input className="field" value={editing.gradeCode} onChange={(e) => updateField("gradeCode", e.target.value)} />
                </div>
                <div className="field-group">
                  <label>Category</label>
                  <select className="field" value={editing.categoryId} onChange={(e) => updateField("categoryId", e.target.value)}>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label>Processing method</label>
                  <select className="field" value={editing.processingMethod} onChange={(e) => updateField("processingMethod", e.target.value)}>
                    <option>Orthodox</option><option>CTC</option><option>Green</option><option>White Tea</option><option>Specialty</option>
                  </select>
                </div>
                <div className="field-group">
                  <label>Group</label>
                  <input className="field" value={editing.groupName} onChange={(e) => updateField("groupName", e.target.value)} />
                </div>
                <div className="field-group">
                  <label>Current price · LKR / kg</label>
                  <input className="field" type="number" min="0" step="10" value={editing.pricePerKg} onChange={(e) => updateField("pricePerKg", Number(e.target.value))} />
                </div>
                <div className="field-group">
                  <label>Effective date</label>
                  <input className="field" type="date" value={editing.effectiveDate} onChange={(e) => updateField("effectiveDate", e.target.value)} />
                </div>
                <div className="field-group full">
                  <label>Grade description</label>
                  <input className="field" value={editing.name} onChange={(e) => updateField("name", e.target.value)} />
                </div>
                <div className="field-group full">
                  <label>Taste profile</label>
                  <input className="field" value={editing.tasteProfile} onChange={(e) => updateField("tasteProfile", e.target.value)} placeholder="Strong · Malty · Brisk" />
                </div>
                <div className="field-group">
                  <label>Cup colour</label>
                  <input className="field" value={editing.cupColour} onChange={(e) => updateField("cupColour", e.target.value)} />
                </div>
                <div className="field-group">
                  <label>Best for</label>
                  <input className="field" value={editing.bestFor} onChange={(e) => updateField("bestFor", e.target.value)} />
                </div>
                <div className="field-group full">
                  <label>Taste description</label>
                  <textarea className="textarea" value={editing.description} onChange={(e) => updateField("description", e.target.value)} />
                </div>
                <div className="field-group">
                  <label>Display order</label>
                  <input className="field" type="number" min="1" value={editing.displayOrder} onChange={(e) => updateField("displayOrder", Number(e.target.value))} />
                </div>
                <div className="field-group">
                  <label>Public status</label>
                  <select className="field" value={editing.isPublished ? "published" : "draft"} onChange={(e) => updateField("isPublished", e.target.value === "published")}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="field-group full">
                  <label>Availability / stock status</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <label style={{ position: "relative", display: "inline-block", width: 42, height: 23, cursor: "pointer" }}>
                      <input type="checkbox" checked={editing.availability !== "OUT_OF_STOCK"} onChange={(e) => updateField("availability", e.target.checked ? "AVAILABLE" : "OUT_OF_STOCK")} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: "absolute", inset: 0, borderRadius: 99, background: editing.availability !== "OUT_OF_STOCK" ? "#3f7b59" : "#cdd2ce", transition: ".2s" }}>
                        <span style={{ position: "absolute", width: 17, height: 17, left: editing.availability !== "OUT_OF_STOCK" ? 22 : 3, top: 3, background: "#fff", borderRadius: "50%", transition: ".2s", boxShadow: "0 2px 5px rgba(0,0,0,.12)" }} />
                      </span>
                    </label>
                    <span style={{ fontSize: 9, fontWeight: 900, color: "var(--muted)", minWidth: 62 }}>{editing.availability === "OUT_OF_STOCK" ? "Out of stock" : editing.availability === "LOW_STOCK" ? "Low stock" : "Available"}</span>
                    <select className="field" style={{ flex: 1 }} value={editing.availability} onChange={(e) => updateField("availability", e.target.value)}>
                      <option value="AVAILABLE">Available</option>
                      <option value="LOW_STOCK">Low stock</option>
                      <option value="OUT_OF_STOCK">Out of stock</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn primary" onClick={handleSaveModal}>Save grade</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast show" style={{ position: "fixed", right: 20, bottom: 20, zIndex: 150, background: "var(--ink)", color: "#fff", padding: "12px 15px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>{toast}</div>}
    </div>
  );
}
