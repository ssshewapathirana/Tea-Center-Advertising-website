import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section style={{ padding: "100px 0", textAlign: "center" }}>
      <div className="container">
        <h1 style={{ fontSize: 64, fontFamily: "var(--font-serif)", color: "var(--gold)", marginBottom: 16 }}>404</h1>
        <p style={{ fontSize: 17, color: "var(--muted)", marginBottom: 24 }}>This page could not be found.</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    </section>
  );
}
