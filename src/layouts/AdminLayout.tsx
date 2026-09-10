import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const PAGE_TITLES: Record<string, [string, string]> = {
  "/admin": ["Dashboard", "Newberg Tea Centre · catalogue control centre"],
  "/admin/tea": ["Tea catalogue", "Prices, grades and public visibility"],
  "/admin/categories": ["Categories", "Public tea finder structure"],
  "/admin/prices": ["Change history", "Catalogue audit trail"],
  "/admin/settings": ["Settings", "Price display and catalogue rules"],
};

function getPageTitle(pathname: string): [string, string] {
  for (const [key, val] of Object.entries(PAGE_TITLES)) {
    if (pathname === key || (key !== "/admin" && pathname.startsWith(key))) return val;
  }
  return ["Dashboard", "Newberg Tea Centre · catalogue control centre"];
}

export default function AdminLayout() {
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [title, subtitle] = getPageTitle(location.pathname);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/admin/login"); return; }
    api.getMe().then((d) => setUser(d.user)).catch(() => {
      localStorage.removeItem("token");
      navigate("/admin/login");
    });
  }, [navigate]);

  const handleLogout = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    localStorage.removeItem("token");
    navigate("/admin/login");
  };

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const displayName = user?.name || "Admin";
  const displayRole = user?.role === "admin" ? "Tea Centre Manager" : (user?.role || "Tea Centre Manager");
  const initials = displayName === "Admin" ? "AD" : displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="mark" />
          <div>
            <strong>Newberg</strong>
            <span>TEA CENTRE · ADMIN</span>
          </div>
        </div>
        <nav className="nav">
          <div className="nav-group">
            <div className="nav-label">Workspace</div>
            <Link to="/admin" className={isActive("/admin", true) ? "active" : ""}><span className="icon">⌂</span>Dashboard</Link>
            <Link to="/admin/tea" className={isActive("/admin/tea") ? "active" : ""}><span className="icon">◫</span>Tea catalogue</Link>
            <Link to="/admin/categories" className={isActive("/admin/categories") ? "active" : ""}><span className="icon">◈</span>Categories</Link>
            <Link to="/admin/activity" className={isActive("/admin/activity") ? "active" : ""}><span className="icon">◌</span>Change history</Link>
          </div>
          <div className="nav-group">
            <div className="nav-label">Management</div>
            <Link to="/admin/images" className={isActive("/admin/images") ? "active" : ""}><span className="icon">◫</span>Images</Link>
            <Link to="/admin/settings" className={isActive("/admin/settings") ? "active" : ""}><span className="icon">⚙</span>Settings</Link>
          </div>
        </nav>
        <div className="sidebar-bottom">
          <div className="user">
            <span className="avatar">{initials}</span>
            <div style={{ flex: 1 }}>
              <strong>{displayName}</strong>
              <span>{displayRole}</span>
            </div>
            <button className="icon-btn" style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "#fff", width: 31, height: 31, borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }} onClick={handleLogout} title="Sign out" aria-label="Sign out">↪</button>
          </div>
        </div>
      </aside>

      <main>
        <header className="top">
          <div className="top-title">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="top-actions">
            <span className="live-pill"><span className="live-dot" />Data connected</span>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
