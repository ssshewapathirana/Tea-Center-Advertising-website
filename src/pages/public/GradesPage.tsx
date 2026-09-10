import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

export default function GradesPage() {
  const [grades, setGrades] = useState<any[]>([]);
  useEffect(() => { api.getGrades().then(setGrades); }, []);

  const grouped = grades.reduce((acc: Record<string, any[]>, g: any) => {
    (acc[g.categoryName] = acc[g.categoryName] || []).push(g);
    return acc;
  }, {});

  return (
    <section style={{ padding: "48px 0 80px" }}>
      <div className="container">
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>Popular grade guide.</h1>
        <p style={{ color: "var(--muted)", fontSize: 17, marginBottom: 40 }}>Understand Ceylon tea grades and what makes each one unique.</p>
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 24, marginBottom: 16, borderBottom: "2px solid var(--line)", paddingBottom: 8 }}>{cat}</h2>
            <div className="grid-3">
              {items.map((g: any) => (
                <Link to={`/tea/${g.slug}`} key={g.id} className="paper-card" style={{ padding: 24, textDecoration: "none", transition: "transform 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--leaf)", background: "var(--soft)", padding: "2px 8px", borderRadius: 10 }}>{g.processingMethod}</span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>#{g.displayOrder}</span>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 22, marginBottom: 2, color: "var(--ink)" }}>{g.gradeCode}</h3>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>{g.name}</p>
                  <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{g.description?.slice(0, 100)}...</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
