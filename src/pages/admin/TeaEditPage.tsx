import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

export default function TeaEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    categoryId: "", gradeCode: "", name: "", slug: "", processingMethod: "", groupName: "",
    description: "", tasteProfile: "", cupColour: "", bestFor: "",
    availability: "AVAILABLE", isPublished: true, displayOrder: 0, initialPrice: 0,
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.getAdminCategories().then(setCategories);
    if (!isNew && id) {
      api.getAdminTeaById(id).then((t) => {
        setForm({
          categoryId: t.categoryId, gradeCode: t.gradeCode, name: t.name, slug: t.slug,
          processingMethod: t.processingMethod, groupName: t.groupName,
          description: t.description || "", tasteProfile: t.tasteProfile || "",
          cupColour: t.cupColour || "", bestFor: t.bestFor || "",
          availability: t.availability, isPublished: t.isPublished,
          displayOrder: t.displayOrder, initialPrice: Number(t.pricePerKg) || 0,
        });
        setLoading(false);
      });
    }
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        await api.createTea(form);
      } else {
        const { initialPrice, ...updateData } = form;
        await api.updateTea(id!, updateData);
      }
      setToast(isNew ? "Tea grade created." : "Tea grade updated.");
      setTimeout(() => navigate("/admin/tea"), 1000);
    } catch (err: any) {
      setToast("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  if (loading) return <div className="spinner" style={{ margin: "40px auto" }} />;

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, marginBottom: 24 }}>{isNew ? "Add New Tea Grade" : "Edit Tea Grade"}</h1>
      <form onSubmit={handleSubmit}>
        <div className="paper-card" style={{ padding: 24 }}>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Category *</label>
              <select className="select" value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)} required>
                <option value="">Select category</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Grade Code *</label>
              <input className="input" value={form.gradeCode} onChange={(e) => update("gradeCode", e.target.value)} required />
            </div>
          </div>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Name *</label>
              <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Slug *</label>
              <input className="input" value={form.slug} onChange={(e) => update("slug", e.target.value)} required />
            </div>
          </div>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Processing Method *</label>
              <input className="input" value={form.processingMethod} onChange={(e) => update("processingMethod", e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Group *</label>
              <input className="input" value={form.groupName} onChange={(e) => update("groupName", e.target.value)} required />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
          <div className="grid-3" style={{ marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Taste Profile</label>
              <input className="input" value={form.tasteProfile} onChange={(e) => update("tasteProfile", e.target.value)} placeholder="Strong · Malty · Brisk" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Cup Colour</label>
              <input className="input" value={form.cupColour} onChange={(e) => update("cupColour", e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Best For</label>
              <input className="input" value={form.bestFor} onChange={(e) => update("bestFor", e.target.value)} />
            </div>
          </div>
          <div className="grid-3" style={{ marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Availability</label>
              <select className="select" value={form.availability} onChange={(e) => update("availability", e.target.value)}>
                <option value="AVAILABLE">Available</option>
                <option value="LOW_STOCK">Low stock</option>
                <option value="OUT_OF_STOCK">Out of stock</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Display Order</label>
              <input className="input" type="number" value={form.displayOrder} onChange={(e) => update("displayOrder", Number(e.target.value))} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>Initial Price (LKR/kg)</label>
              <input className="input" type="number" value={form.initialPrice} onChange={(e) => update("initialPrice", Number(e.target.value))} />
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={form.isPublished} onChange={(e) => update("isPublished", e.target.checked)} />
            Published
          </label>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : isNew ? "Create Tea" : "Save Changes"}</button>
          <button type="button" className="btn btn-outline" onClick={() => navigate("/admin/tea")}>Cancel</button>
        </div>
      </form>
      {toast && <div className={`toast ${toast.startsWith("Error") ? "toast-error" : "toast-success"}`}>{toast}</div>}
    </div>
  );
}
