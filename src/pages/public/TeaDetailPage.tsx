import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../lib/api";
import { rs, availabilityLabel, availabilityClass } from "../../lib/utils";
import { ArrowLeft } from "lucide-react";

export default function TeaDetailPage() {
  const { slug } = useParams();
  const [grade, setGrade] = useState<any>(null);
  const [error, setError] = useState(false);
  const [grams, setGrams] = useState(100);

  useEffect(() => {
    if (slug) {
      api.getGradeBySlug(slug).then(setGrade).catch(() => setError(true));
    }
  }, [slug]);

  if (error) return <div className="container" style={{ padding: "80px 0", textAlign: "center" }}><h2>Tea grade not found.</h2><Link to="/tea" className="btn btn-outline" style={{ marginTop: 16 }}>Back to prices</Link></div>;
  if (!grade) return <div className="container" style={{ padding: "80px 0" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>;

  const calcPrice = () => (Number(grade.pricePerKg) * grams) / 1000;

  return (
    <section style={{ padding: "48px 0 80px" }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <Link to="/tea" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
          <ArrowLeft size={14} /> Back to all grades
        </Link>
        <div className="paper-card" style={{ padding: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--leaf)", background: "var(--soft)", padding: "3px 10px", borderRadius: 10 }}>{grade.processingMethod}</span>
              <span className={`badge ${availabilityClass(grade.availability)}`} style={{ marginLeft: 8 }}>{availabilityLabel(grade.availability)}</span>
            </div>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{grade.categoryName}</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 40, marginBottom: 4 }}>{grade.gradeCode}</h1>
          <p style={{ fontSize: 17, color: "var(--muted)", marginBottom: 24 }}>{grade.name}</p>

          <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div style={{ background: "var(--soft)", borderRadius: 12, padding: 20, border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Price per kg</div>
              <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 24, color: "var(--gold)" }}>{rs(Number(grade.pricePerKg))}</div>
            </div>
            <div style={{ background: "var(--soft)", borderRadius: 12, padding: 20, border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Cup colour</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{grade.cupColour}</div>
            </div>
            <div style={{ background: "var(--soft)", borderRadius: 12, padding: 20, border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Best for</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{grade.bestFor}</div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Description</h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>{grade.description}</p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Taste profile</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(grade.tasteProfile || "").split(" · ").map((t: string) => (
                <span key={t} style={{ padding: "6px 14px", background: "var(--soft)", borderRadius: 20, fontSize: 14, border: "1px solid var(--line)" }}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--soft)", borderRadius: 12, padding: 24, border: "1px solid var(--line)" }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Price calculator</h3>
            <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Grams</label>
                <input type="number" className="input" value={grams} onChange={(e) => setGrams(Number(e.target.value))} style={{ width: 120 }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[100, 250, 500, 1000].map((g) => (
                  <button key={g} onClick={() => setGrams(g)} className={`btn ${grams === g ? "btn-primary" : "btn-outline"} btn-sm`}>{g}g</button>
                ))}
              </div>
              <div style={{ marginLeft: "auto" }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{grams}g</div>
                <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 24, color: "var(--gold)" }}>Rs. {calcPrice().toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
