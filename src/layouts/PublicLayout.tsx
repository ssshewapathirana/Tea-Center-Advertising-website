import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { to: "/#story", label: "About" },
  { to: "/#prices", label: "Tea Prices" },
  { to: "/#grades", label: "Tea Grades" },
  { to: "/#benefits", label: "Why tea" },
  { to: "/#contact", label: "Contact" },
];

function LeafMark({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`relative h-10 w-10 flex-none rounded-[13px] ${dark ? "border border-white/10 bg-[#0f261b]" : "bg-ink"}`}
      aria-hidden="true"
    >
      <span
        className="absolute top-2 left-3 h-[18px] w-[11px] rounded-[90%_8%_90%_8%] bg-gold"
        style={{ transform: "rotate(-34deg)" }}
      />
      <span
        className="absolute top-[13px] left-5 h-[18px] w-[11px] rounded-[90%_8%_90%_8%] bg-gold"
        style={{ transform: "rotate(34deg)" }}
      />
    </span>
  );
}

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  // React Router doesn't scroll to hashes on its own — wire every
  // header/footer anchor click to its section (or top for plain routes).
  useEffect(() => {
    const t = setTimeout(() => {
      if (location.hash) {
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 60);
    return () => clearTimeout(t);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (to: string) =>
    to.startsWith("/#") ? location.hash === to.slice(1) : location.pathname === to;

  // Delegated fallback: guarantees EVERY in-page anchor (header, mobile
  // menu, footer, CTA) scrolls to its section — even re-clicking the
  // link you're already on, where the router itself does nothing.
  const handleAnchorClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest?.("a[href*='#']") as HTMLAnchorElement | null;
    if (!a) return;
    const href = a.getAttribute("href") || "";
    const idx = href.indexOf("#");
    if (idx === -1) return;
    const id = href.slice(idx + 1);
    if (!id) return;
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream font-sans text-ink" onClick={handleAnchorClick}>
      <div className="bg-ink py-[9px] text-xs text-[#edf4ee]">
        <div className="container flex justify-between gap-5">
          <span>🇱🇰 Ceylon Tea · Browns Plantations</span>
          <span>Ceylon Tea · Sri Lanka</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/90 backdrop-blur-md">
        <div className="container flex h-[74px] items-center justify-between">
          <Link to="/" className="flex items-center gap-[11px] font-extrabold no-underline">
            <LeafMark />
            <span className="text-ink">Newberg Tea Centre</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-[#526057] md:flex" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <Link
                key={`${l.to}-${l.label}`}
                to={l.to}
                className={`no-underline transition-colors hover:text-ink ${isActive(l.to) ? "font-bold text-ink" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <Link to="/#prices" className="hidden rounded-full bg-ink px-4 py-2.5 text-[13px] font-extrabold text-white no-underline md:inline-flex">
              View prices
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`h-11 w-11 cursor-pointer flex-col items-center justify-center gap-1 rounded-[13px] border border-line bg-white md:hidden ${menuOpen ? "flex" : "flex"}`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-line bg-paper pt-1.5 pb-3.5 shadow-[0_18px_34px_rgba(23,50,38,0.1)] md:hidden" aria-label="Mobile">
            {NAV_LINKS.map((l) => (
              <Link
                key={`${l.to}-${l.label}`}
                to={l.to}
                className="block border-b border-line px-[22px] py-3 text-sm font-extrabold text-ink2 no-underline last:border-b-0"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer id="contact" className="mt-3 scroll-mt-24 bg-ink text-[#dbe5dc]">
        <div className="container foot">
          <div className="foot-brand">
            <div className="foot-mark">
              <span className="mark" />
              <div>
                <h4>Newberg Tea Centre</h4>
                <span className="foot-kicker">CEYLON TEA · SRI LANKA</span>
              </div>
            </div>
            <p>Explore Ceylon tea by grade, character and price — then learn what makes each cup different.</p>
            <a className="foot-cta" href="/#prices">Explore the tea finder →</a>
          </div>
          <div>
            <h4>Explore</h4>
            <a href="/#prices">Tea prices</a>
            <a href="/#grades">Tea grade guide</a>
            <a href="/#story">How tea is made</a>
            <a href="/#benefits">Benefits of tea</a>
          </div>
          <div>
            <h4>Learn about Ceylon</h4>
            <a href="https://srilankateaboard.lk/ceylon-tea/tea-growing-regions/" target="_blank" rel="noopener">Seven growing regions ↗</a>
            <a href="https://srilankateaboard.lk/tea-statistics/" target="_blank" rel="noopener">Tea statistics ↗</a>
            <a href="https://srilankateaboard.lk/ceylon-tea/lion-logo-symbol-of-quality/" target="_blank" rel="noopener">Lion Logo &amp; quality ↗</a>
            <a href="https://srilankateaboard.lk/downloads/" target="_blank" rel="noopener">Tea Board resources ↗</a>
          </div>
          <div className="foot-note">
            <h4>Why Ceylon tea?</h4>
            <p>Tea grown across Sri Lanka&apos;s seven agro-climatic regions develops different flavour, aroma, strength and colour profiles.</p>
            <div className="foot-badge">
              <strong>100% Ceylon Tea</strong>
              <span>Look for the Sri Lanka Tea Board Lion Logo on qualifying packs.</span>
            </div>
          </div>
        </div>
        <div className="container foot-source">
          <span>Independent reference: Sri Lanka Tea Board</span>
          <span>Tea information &amp; market data links open in a new tab</span>
        </div>
        <div className="container copyright">
          © 2026 Newberg Tea Centre · Ceylon Tea information interface
        </div>
      </footer>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`fixed right-[18px] bottom-[18px] z-[60] h-[46px] w-[46px] rounded-full border border-line bg-paper text-[17px] text-ink shadow-[0_18px_45px_rgba(23,50,38,0.10)] transition ${showTop ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2.5 opacity-0"}`}
      >
        ↑
      </button>
    </div>
  );
}
