import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <section style={{ padding: "48px 0 80px" }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 style={{ fontSize: 36, marginBottom: 16 }}>About Newberg Tea Centre</h1>
        <p style={{ color: "var(--muted)", fontSize: 17, lineHeight: 1.8, marginBottom: 24 }}>
          Newberg Tea Centre is a tea information and transparent pricing platform dedicated to Ceylon tea.
          We believe every tea drinker deserves to know exactly what they're buying — the grade, the taste, the price, and the story behind every cup.
        </p>
        <p style={{ color: "var(--muted)", fontSize: 17, lineHeight: 1.8, marginBottom: 24 }}>
          Our platform provides real-time pricing for a wide range of Ceylon tea grades — from everyday Broken Orange Pekoe to rare Golden Tips.
          Prices are updated regularly, and every change is recorded in a transparent history.
        </p>
        <div className="paper-card" style={{ padding: 32, marginTop: 32 }}>
          <h2 style={{ fontSize: 24, marginBottom: 12 }}>Our mission</h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
            Make Ceylon tea pricing transparent, accessible, and trustworthy — so buyers can make informed decisions with confidence.
          </p>
        </div>
        <Link to="/tea" className="btn btn-primary" style={{ marginTop: 24 }}>Explore tea prices</Link>
      </div>
    </section>
  );
}
