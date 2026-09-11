import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await api.login(email, password);
      localStorage.setItem("token", token);
      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="shell">
        <section className="visual">
          <div className="leaf a" />
          <div className="leaf b" />
          <div className="leaf c" />
          <div className="ridge" />
          <div className="visual-content">
            <div className="brand">
              <span className="mark" />
              <div><strong>Newberg</strong><span>TEA CENTRE</span></div>
            </div>
            <div className="visual-copy">
              <div className="eyebrow">Admin workspace</div>
              <h1>Manage the tea. Keep the story clear.</h1>
              <p>Control tea categories, grades, prices and availability from one secure catalogue workspace.</p>
              <div className="pill"><i /> Catalogue management portal</div>
            </div>
          </div>
        </section>
        <section className="form-side">
          <div className="form-wrap">
            <div className="eyebrow">Welcome back</div>
            <h2>Sign in to Newberg Admin</h2>
            <p className="lead">Use your administrator account to access the tea catalogue control centre.</p>
            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="email">Email</label>
                <input className="field" id="email" type="email" autoComplete="username" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="field-group">
                <label htmlFor="password">Password</label>
                <div className="password-wrap">
                  <input className="field" id="password" type={showPw ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button className="show-pass" type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"}>{showPw ? "◌" : "◉"}</button>
                </div>
              </div>
              <div className="row">
                <label className="check"><input type="checkbox" /> Keep me signed in</label>
                <button type="button" className="forgot" onClick={() => alert("Password reset is not available in this interface.")}>Forgot password?</button>
              </div>
              <button className="submit" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in to dashboard →"}</button>
              {error && <div className="error show">{error}</div>}
            </form>
            <div className="footer-note">Newberg Tea Centre · Administration interface</div>
          </div>
        </section>
      </div>
    </div>
  );
}
