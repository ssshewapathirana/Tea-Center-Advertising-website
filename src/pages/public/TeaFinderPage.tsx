import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { rs, availabilityLabel, availabilityClass } from "../../lib/utils";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

interface Grade extends Record<string, any> {}

export default function TeaFinderPage() {
  const [params] = useSearchParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [activeCat, setActiveCat] = useState(params.get("category") || "black-tea");
  const [activeGroup, setActiveGroup] = useState("All");
  const [search, setSearch] = useState(params.get("search") || "");
  const [sort, setSort] = useState("recommended");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getCategories(), api.getGrades()]).then(([cats, g]) => {
      setCategories(cats);
      setGrades(g);
      setLoading(false);
    });
  }, []);

  const groups = ["All", ...new Set(grades.filter((g) => g.categorySlug === activeCat).map((g) => g.groupName))];

  let filtered = grades.filter((g) => g.categorySlug === activeCat && (activeGroup === "All" || g.groupName === activeGroup));
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((g) => (g.gradeCode + " " + g.name + " " + g.tasteProfile + " " + g.processingMethod).toLowerCase().includes(q));
  }
  switch (sort) {
    case "low": filtered.sort((a, b) => Number(a.pricePerKg) - Number(b.pricePerKg)); break;
    case "high": filtered.sort((a, b) => Number(b.pricePerKg) - Number(a.pricePerKg)); break;
    case "az": filtered.sort((a, b) => a.gradeCode.localeCompare(b.gradeCode)); break;
  }

  const toggle = (code: string) => setExpanded((s) => { const n = new Set(s); n.has(code) ? n.delete(code) : n.add(code); return n; });

  return (
    <section style={{ padding: "48px 0 80px" }}>
      <div className="container">
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>Choose your tea.</h1>
        <p style={{ color: "var(--muted)", fontSize: 17, marginBottom: 32 }}>Current prices for Ceylon tea grades — updated regularly.</p>

        {/* Category tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {categories.map((c) => (
            <button key={c.id} onClick={() => { setActiveCat(c.slug); setActiveGroup("All"); setSearch(""); }} className={`btn ${activeCat === c.slug ? "btn-primary" : "btn-outline"} btn-sm`}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Sub-filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {groups.map((g) => (
            <button key={g} onClick={() => setActiveGroup(g)} className={`btn ${activeGroup === g ? "btn-primary" : "btn-outline"}`} style={{ fontSize: 12, padding: "5px 14px" }}>
              {g === "All" ? "All grades" : g}
            </button>
          ))}
        </div>

        {/* Search + sort */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
            <input className="input" placeholder="Search grades..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
          </div>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 180 }}>
            <option value="recommended">Recommended</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="az">Grade A–Z</option>
          </select>
        </div>

        {/* Results */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 14, color: "var(--muted)" }}>{filtered.length} {filtered.length === 1 ? "grade" : "grades"}</span>
          <button onClick={() => setExpanded(filtered.length > 0 && expanded.size === filtered.length ? new Set() : new Set(filtered.map((g) => g.gradeCode)))} className="btn btn-outline" style={{ fontSize: 12, padding: "5px 14px" }}>
            {filtered.length > 0 && expanded.size === filtered.length ? "Collapse all" : "Expand all"}
          </button>
        </div>

        {loading ? (
          <div className="grid-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="paper-card" style={{ padding: 60, textAlign: "center" }}>
            <p style={{ color: "var(--muted)", marginBottom: 16 }}>No grades found matching your search.</p>
            <button onClick={() => { setSearch(""); setActiveGroup("All"); }} className="btn btn-outline btn-sm">Clear filters</button>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map((g) => {
              const isOpen = expanded.has(g.gradeCode);
              return (
                <div key={g.id} className="paper-card" style={{ padding: 0, overflow: "hidden", transition: "all 0.2s" }}>
                  <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--leaf)", background: "var(--soft)", padding: "2px 8px", borderRadius: 10 }}>{g.processingMethod}</span>
                      {Number(g.displayOrder) === 1 && (
                        <span style={{ background: "linear-gradient(135deg,#c69a52,#e2c78e)", color: "#fff", fontSize: 8.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", padding: "4px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>★ Top pick</span>
                      )}
                    </div>
                    <button onClick={() => toggle(g.gradeCode)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                      Taste {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                  <div style={{ padding: "12px 20px" }}>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 24, marginBottom: 2 }}>{g.gradeCode}</h3>
                    <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>{g.name}</p>
                    {isOpen && (
                      <div style={{ background: "var(--soft)", borderRadius: 10, padding: 16, marginBottom: 12, border: "1px solid var(--line)" }}>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Taste</span>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                            {(g.tasteProfile || "").split(" · ").map((t: string) => (
                              <span key={t} style={{ fontSize: 12, padding: "2px 8px", background: "var(--white)", borderRadius: 8, border: "1px solid var(--line)" }}>{t}</span>
                            ))}
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 10 }}>{g.description}</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div><span style={{ fontSize: 11, color: "var(--muted)" }}>Cup colour</span><div style={{ fontSize: 13, fontWeight: 600 }}>{g.cupColour}</div></div>
                          <div><span style={{ fontSize: 11, color: "var(--muted)" }}>Best for</span><div style={{ fontSize: 13, fontWeight: 600 }}>{g.bestFor}</div></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "0 20px 20px" }}>
                    <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 22, color: "var(--gold)" }}>{rs(Number(g.pricePerKg))}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>per kilogram</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>100g {rs(Number(g.pricePerKg) / 10)}</span>
                      <span className={`badge ${availabilityClass(g.availability)}`}>{availabilityLabel(g.availability)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#7b847e", fontSize: 10, marginTop: 12 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#70a174", boxShadow: "0 0 0 4px rgba(112,161,116,.12)" }} />
                      Updated today
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
