import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { rs } from "../../lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" style={{ margin: "40px auto" }} />;
  if (!data) return <p>Failed to load dashboard.</p>;

  const { stats, recentActivity } = data;

  return (
    <div>
      <div className="section-head">
        <div>
          <span className="eyebrow">Overview</span>
          <h2>Tea catalogue at a glance.</h2>
        </div>
        <p>Manage every public tea category, grade, price and supporting information from one place.</p>
      </div>

      <div className="grid4">
        <div className="stat"><span className="label">Total grades</span><strong>{stats.totalGrades}</strong><small>Across {stats.totalCategories} visible categories</small></div>
        <div className="stat"><span className="label">Published</span><strong>{stats.published}</strong><small>Currently visible to customers</small></div>
        <div className="stat"><span className="label">Draft / review</span><strong>{stats.totalGrades - stats.published}</strong><small>Changes not yet public</small></div>
        <div className="stat"><span className="label">Average / kg</span><strong>{rs(stats.avgPrice)}</strong><small>Published grades, simple average</small></div>
      </div>

      <div className="layout2">
        <div className="panel">
          <div className="panel-head"><div><h2>Quick actions</h2><p>Common catalogue tasks</p></div></div>
          <div className="panel-body">
            <div className="quick-grid">
              <button className="quick" onClick={() => navigate("/admin/tea/new")}><strong>＋ Add new grade</strong><span>Create a new tea grade and assign its category.</span></button>
              <button className="quick" onClick={() => navigate("/admin/tea")}><strong>▣ Update prices</strong><span>Edit the current LKR/kg price for any grade.</span></button>
              <button className="quick" onClick={() => navigate("/admin/categories")}><strong>◈ Manage categories</strong><span>Review category names, methods and descriptions.</span></button>
              <button className="quick" onClick={() => navigate("/admin/activity")}><strong>◌ Review history</strong><span>See recent edits and publishing activity.</span></button>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div><h2>Recent changes</h2><p>Latest admin activity</p></div></div>
          <div className="panel-body">
            {recentActivity.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>No activity yet.</div>
            ) : recentActivity.slice(0, 5).map((a: any) => (
              <div key={a.id} className="activity-row">
                <span className="a-dot" />
                <div>
                  <strong>{a.action}</strong>
                  <span>{a.description} · {new Date(a.createdAt).toLocaleDateString("en-LK", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head">
          <div><h2>Current price snapshot</h2><p>Public-facing catalogue values</p></div>
          <button className="btn" onClick={() => navigate("/admin/tea")}>Open catalogue →</button>
        </div>
        <div className="panel-body">
          <table className="table">
            <thead><tr><th>Grade</th><th>Category</th><th>Price</th><th>Status</th></tr></thead>
            <tbody>
              {data.recentPriceChanges?.slice(0, 6).map((p: any) => (
                <tr key={p.id}>
                  <td><span className="grade-name">{p.grade_code}</span></td>
                  <td>{p.category_name || "—"}</td>
                  <td><span className="price">{rs(Number(p.new_price))}</span><span className="price-unit"> /kg</span></td>
                  <td><span className="status">Published</span></td>
                </tr>
              )) || <tr><td colSpan={4} style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>No price data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
