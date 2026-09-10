import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { rs, availabilityLabel, availabilityClass } from "../../lib/utils";
import { ArrowRight, ChevronDown, ChevronUp, Search } from "lucide-react";

const BASKET_KEY = "newberg-selection-v1";

const STORIES = [
  {
    tag: "Step 01 · In the garden",
    title: "It starts with two leaves and a bud.",
    text: "Every morning on the slopes, pluckers move bush to bush picking only the freshest top growth — 7 to 10 days after the last round, the leaf is at its best.",
  },
  {
    tag: "Steps 02–05 · In the factory",
    title: "Where leaf becomes tea.",
    text: "Withering, rolling, oxidising and firing — about 24 hours of careful craft that sets the colour, flavour and strength of every grade we sell.",
  },
  {
    tag: "Steps 06–07 · Graded & tasted",
    title: "Graded, tasted, on its way to you.",
    text: "Sorted into familiar grades, checked by the estate taster and packed within days — the tea on this page left the factory only recently.",
  },
];

const PROCESS_STEPS = [
  { no: "01", name: "Plucking", desc: "Hand-picked two leaves and a bud, every 7–10 days.", slide: 0 },
  { no: "02", name: "Withering", desc: "Gentle warm air for 12–18 hours softens and dries the fresh leaf.", slide: 1 },
  { no: "03", name: "Rolling", desc: "Twisted orthodox leaf (OP, BOP) or cut-tear-curl granules (BP1, PF1).", slide: 1 },
  { no: "04", name: "Oxidation", desc: "The leaf turns coppery as colour, flavour and strength develop.", slide: 1 },
  { no: "05", name: "Drying", desc: "Firing at about 100°C locks in character; moisture drops to ~3%.", slide: 1 },
  { no: "06", name: "Grading", desc: "Sieves sort the leaf into grades — each with its own character and price.", slide: 2 },
  { no: "07", name: "Tasting & dispatch", desc: "Every batch is tasted, then weighed, sealed and sent to buyers.", slide: 2 },
];

const TAB_SUBTITLES: Record<string, string> = {
  "black-tea": "Orthodox & CTC",
  "green-tea": "Fresh & aromatic",
  "specialty-tea": "Premium selections",
};

const GUIDE_CARDS = [
  { num: "01 · Black · Orthodox", grade: "BOP", cat: "black-tea", desc: "Broken Orange Pekoe — a classic broken-leaf Ceylon tea grade." },
  { num: "02 · Black · Orthodox", grade: "BOPF", cat: "black-tea", desc: "Broken Orange Pekoe Fannings — a smaller particle grade." },
  { num: "03 · Black · Orthodox", grade: "FBOP", cat: "black-tea", desc: "Flowery Broken Orange Pekoe — broken leaf with a more tippy character." },
  { num: "04 · Black · CTC", grade: "BP1", cat: "black-tea", desc: "A CTC grade with granular particles for a strong, quick infusion." },
];

export default function HomePage() {
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [pageImages, setPageImages] = useState<any[]>([]);

  // Story slider
  const [storyIdx, setStoryIdx] = useState(0);
  const [storyPaused, setStoryPaused] = useState(false);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || storyPaused) return;
    const t = setInterval(() => setStoryIdx((i) => (i + 1) % STORIES.length), 6500);
    return () => clearInterval(t);
  }, [storyPaused]);
  const showStory = (i: number) => setStoryIdx(((i % STORIES.length) + STORIES.length) % STORIES.length);

  // Price finder
  const [activeCat, setActiveCat] = useState("black-tea");
  const [activeGroup, setActiveGroup] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recommended");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const pricesRef = useRef<HTMLElement>(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
    api.getPublicImages().then(setPageImages).catch(() => {});
    Promise.all([api.getCategories(), api.getGrades()])
      .then(([cats, g]) => {
        setCategories(cats);
        setGrades(g);
        if (cats.length && !cats.some((c: any) => c.slug === "black-tea")) setActiveCat(cats[0].slug);
      })
      .catch(() => {});
    try {
      const raw = localStorage.getItem(BASKET_KEY);
      if (raw) setSelected(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(BASKET_KEY, JSON.stringify([...selected]));
    } catch {}
  }, [selected]);

  const groups = useMemo(
    () => ["All", ...new Set(grades.filter((g) => g.categorySlug === activeCat).map((g) => g.groupName))],
    [grades, activeCat]
  );

  const filtered = useMemo(() => {
    let items = grades.filter((g) => g.categorySlug === activeCat && (activeGroup === "All" || g.groupName === activeGroup));
    const q = search.trim().toLowerCase();
    if (q) items = items.filter((g) => `${g.gradeCode} ${g.name} ${g.tasteProfile} ${g.processingMethod}`.toLowerCase().includes(q));
    items = [...items];
    if (sort === "low") items.sort((a, b) => Number(a.pricePerKg) - Number(b.pricePerKg));
    else if (sort === "high") items.sort((a, b) => Number(b.pricePerKg) - Number(a.pricePerKg));
    else if (sort === "az") items.sort((a, b) => a.gradeCode.localeCompare(b.gradeCode));
    else items.sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));
    return items;
  }, [grades, activeCat, activeGroup, search, sort]);

  const activeCatName = categories.find((c) => c.slug === activeCat)?.name ?? "Black Tea";

  const toggleExpand = (code: string) => {
    const n = new Set(expanded);
    if (n.has(code)) n.delete(code);
    else n.add(code);
    setExpanded(n);
  };
  const toggleExpandAll = () => {
    if (filtered.length > 0 && expanded.size === filtered.length) setExpanded(new Set());
    else setExpanded(new Set(filtered.map((g) => g.gradeCode)));
  };
  const toggleSelect = (code: string) => {
    const n = new Set(selected);
    if (n.has(code)) n.delete(code);
    else n.add(code);
    setSelected(n);
  };

  const jumpToCard = (gradeCode: string) => {
    const item = grades.find((g) => g.gradeCode === gradeCode);
    if (item && item.categorySlug !== activeCat) {
      setActiveCat(item.categorySlug);
      setActiveGroup("All");
      setSearch("");
    }
    {
      const n = new Set(expanded);
      n.add(gradeCode);
      setExpanded(n);
    }
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-grade="${gradeCode}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("flash");
      setTimeout(() => el?.classList.remove("flash"), 1900);
    });
  };

  const openGradeInFinder = (cat: string, grade: string) => {
    setActiveCat(cat);
    setActiveGroup("All");
    setSearch(grade);
    setSort("recommended");
    pricesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const basketItems = grades.filter((g) => selected.has(g.gradeCode));
  const basketKg = basketItems.reduce((s, g) => s + Number(g.pricePerKg), 0);
  const basketMail = (() => {
    const lines = [
      "Hello Newberg Tea Centre,",
      "",
      "I would like to enquire about these teas:",
      ...basketItems.map((g) => `- ${g.gradeCode} (${g.processingMethod}) — ${rs(Number(g.pricePerKg))} /kg`),
      "",
      `Selection total: ${rs(basketKg)} /kg`,
      "",
      "Sent from the Newberg Tea Centre website.",
    ];
    return `mailto:?subject=${encodeURIComponent(`Newberg Tea Centre — tea enquiry (${basketItems.length} ${basketItems.length === 1 ? "tea" : "teas"})`)}&body=${encodeURIComponent(lines.join("\n"))}`;
  })();

  // Calculator: guided category → grade workflow
  const [calcCat, setCalcCat] = useState("");
  const [calcGrade, setCalcGrade] = useState("");
  const [kgPrice, setKgPrice] = useState(1280);
  const [grams, setGrams] = useState(100);
  const calcTeas = useMemo(
    () => grades.filter((g) => g.categorySlug === (categories.find((c) => c.name === calcCat || c.slug === calcCat)?.slug ?? calcCat)).sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder)),
    [grades, categories, calcCat]
  );
  const calcTea = calcTeas.find((g) => g.gradeCode === calcGrade);
  useEffect(() => {
    if (!calcTeas.length) {
      setCalcGrade("");
      return;
    }
    const top = calcTeas[0];
    setCalcGrade(top.gradeCode);
    setKgPrice(Number(top.pricePerKg));
  }, [calcCat]); // eslint-disable-line react-hooks/exhaustive-deps
  const pickCalcGrade = (code: string) => {
    setCalcGrade(code);
    if (code === "__custom") return;
    const item = calcTeas.find((g) => g.gradeCode === code);
    if (item) setKgPrice(Number(item.pricePerKg));
  };

  return (
    <>
      {/* ============ HERO ============ */}
      <div className="container pt-9 pb-6">
        <div className="grid gap-6 lg:grid-cols-[1.04fr_0.96fr]">
          <div className="rounded-[30px] border border-line bg-paper p-8 shadow-[0_18px_45px_rgba(23,50,38,0.10)] md:p-[52px]">
            <span className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.15em] text-gold uppercase">
              <span className="h-[7px] w-[7px] rounded-full bg-gold" /> Ceylon Tea · Sri Lanka
            </span>
            <h1 className="mt-4 font-serif text-5xl leading-[0.98] tracking-[-0.045em] md:text-[clamp(44px,6vw,74px)]">
              Know your tea.
              <br />
              Know the price.
            </h1>
            <p className="mt-4 max-w-[600px] text-[17px] text-muted">
              Explore tea categories, understand familiar grades, and find a clear price per kilogram or 100 grams — all in
              one simple place.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <a href="#prices" className="btn primary btn">
                Explore tea prices <ArrowRight size={16} />
              </a>
              <a href="#grades" className="btn secondary btn">
                Explore grades
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-6 border-t border-line pt-5 text-xs text-muted">
              <div>
                <strong className="block text-[13px] text-ink">Newberg</strong>Estate story
              </div>
              <div>
                <strong className="block text-[13px] text-ink">Black · Green · Specialty</strong>Tea families
              </div>
              <div>
                <strong className="block text-[13px] text-ink">kg + 100g</strong>Simple price view
              </div>
            </div>
          </div>
          <div
            className="relative min-h-[330px] overflow-hidden rounded-[30px] shadow-[0_18px_45px_rgba(23,50,38,0.10)] lg:min-h-[500px]"
            style={{ background: "linear-gradient(145deg,#264735,#6b805b 55%,#d2b26e)" }}
          >
            {(() => {
              const heroImg = pageImages.find((i) => i.section === "hero" && i.isActive);
              const hasHeroImage = heroImg?.imageUrl && !heroImg.imageUrl.includes("/drive/folders/") && !heroImg.imageUrl.includes("/drive/u/");
              if (hasHeroImage) {
                return (
                  <>
                    <img
                      src={heroImg.imageUrl}
                      alt={heroImg.alt || "Newberg Tea Centre"}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(17,38,27,.55),rgba(17,38,27,.10) 60%)" }} />
                  </>
                );
              }
              return (
                <>
                  <div className="absolute inset-0" style={{
                    background: "radial-gradient(circle at 22% 18%,rgba(226,199,142,.78),transparent 25%),radial-gradient(circle at 78% 26%,rgba(143,167,117,.72),transparent 28%),linear-gradient(to top,rgba(17,38,27,.58),transparent 58%)",
                  }} />
                  <div className="absolute -right-[6%] -bottom-[4%] -left-[6%] h-[57%]" style={{
                    background: "linear-gradient(180deg,#607653,#284634)",
                    clipPath: "polygon(0 51%,12% 38%,24% 47%,35% 26%,48% 42%,61% 18%,77% 35%,90% 22%,100% 39%,100% 100%,0 100%)",
                  }} />
                </>
              );
            })()}
            <div className="absolute bottom-6 left-6 rounded-[17px] bg-paper/90 p-4 shadow-[0_10px_26px_rgba(0,0,0,0.13)]">
              <small className="block text-[9px] font-black tracking-[0.12em] text-gold uppercase">
                From the hills of Sri Lanka
              </small>
              <strong className="block font-serif text-[22px]">Newberg Tea Centre</strong>
              <span className="mt-1 block text-[11px] font-extrabold text-ink2">
                {stats ? `from ${rs(stats.minPrice)} /kg` : "from Rs. — /kg"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ STORY ============ */}
      <section id="story" className="scroll-mt-24 py-[52px]">
        <div className="container">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.15em] text-gold uppercase">
                <span className="h-[7px] w-[7px] rounded-full bg-gold" /> Inside the tea journey
              </span>
              <h2 className="mt-1.5 font-serif text-4xl leading-tight tracking-[-0.03em]">
                A real story behind every grade.
              </h2>
            </div>
            <p className="max-w-[560px] text-sm text-muted">
              Follow the seven steps from the garden to the price list — the simple, honest journey every Newberg grade
              travels before it reaches your cup.
            </p>
          </div>

          <div
            className="grid gap-[22px] lg:grid-cols-[1.16fr_0.84fr]"
            onMouseEnter={() => setStoryPaused(true)}
            onMouseLeave={() => setStoryPaused(false)}
          >
            <div className="relative min-h-[430px] overflow-hidden rounded-[28px] bg-[#203a2a] lg:min-h-[505px]">
              {STORIES.map((s, i) => {
                const storyImg = pageImages.filter((img) => img.section === `story-${i}` && img.isActive);
                const firstImg = storyImg[0];
                const hasValidImage = firstImg?.imageUrl && !firstImg.imageUrl.includes("/drive/folders/") && !firstImg.imageUrl.includes("/drive/u/");
                const bg = i === 0
                  ? "linear-gradient(160deg,#2c4a33,#718a61 60%,#c9a86a)"
                  : i === 1
                    ? "linear-gradient(160deg,#3a3a2c,#6b6b4a 55%,#a08c5a)"
                    : "linear-gradient(160deg,#1e3327,#4a6b52 55%,#d2b26e)";
                return (
                  <div
                    key={s.tag}
                    className={`absolute inset-0 flex items-end p-7 transition-opacity duration-500 ${i === storyIdx ? "opacity-100" : "opacity-0"}`}
                    style={{ background: hasValidImage ? "#203a2a" : bg }}
                    aria-hidden={i !== storyIdx}
                  >
                    {hasValidImage && (
                      <img src={firstImg.imageUrl} alt={firstImg.alt || s.title} className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    <div className="relative z-[3] text-white">
                      <div className="text-[10px] font-black tracking-[0.14em] text-gold2 uppercase">{s.tag}</div>
                      <h3 className="mt-2 font-serif text-[28px] leading-tight md:text-[34px]">{s.title}</h3>
                      <p className="mt-1 max-w-[560px] text-[13px] text-[#e8eee8]">{s.text}</p>
                    </div>
                  </div>
                );
              })}
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(9,26,17,0.72)] to-[rgba(9,26,17,0.05)]" style={{ background: "linear-gradient(to top,rgba(9,26,17,.72),rgba(9,26,17,.05) 62%)" }} />
              <div className="absolute top-5 right-5 left-5 z-[3] flex justify-between text-[11px] font-extrabold text-white">
                <span className="rounded-full bg-ink/75 px-2.5 py-2 backdrop-blur-md">From garden to cup</span>
                <span className="rounded-full border border-white/25 bg-white/15 px-2.5 py-2 backdrop-blur-md">
                  {String(storyIdx + 1).padStart(2, "0")} / {String(STORIES.length).padStart(2, "0")}
                </span>
              </div>
            </div>

            <aside className="flex min-h-[430px] flex-col justify-between rounded-[28px] border border-line bg-paper p-6 shadow-[0_18px_45px_rgba(23,50,38,0.10)] md:p-[34px] lg:min-h-[505px]">
              <div>
                <span className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.15em] text-gold uppercase">
                  <span className="h-[7px] w-[7px] rounded-full bg-gold" /> The process, simply
                </span>
                <h2 className="mt-2.5 font-serif text-4xl leading-tight">How our tea is made.</h2>
                <p className="text-sm text-muted">
                  Seven honest steps between the garden and the price card — the same journey every grade on this page has
                  travelled. Tap any step to see it.
                </p>
                <div className="mt-6">
                  {PROCESS_STEPS.map((st) => (
                    <button
                      key={st.no}
                      type="button"
                      onClick={() => showStory(st.slide)}
                      className={`grid w-full grid-cols-[35px_1fr] gap-3 border-t border-line py-4 text-left first:border-t-0 ${storyIdx === st.slide ? "[&>span:first-child]:bg-gold [&>span:first-child]:text-white" : ""}`}
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-soft text-[11px] font-black">{st.no}</span>
                      <span>
                        <strong className="block text-[13px]">{st.name}</strong>
                        <span className="mt-0.5 block text-xs text-muted">{st.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-3.5 rounded-xl border border-[#e9dec6] bg-[#fffaf0] p-2.5 text-[10.5px] leading-relaxed text-[#786745]">
                  Every batch passes the estate tasting room before dispatch — see the grades and today&apos;s prices in the{" "}
                  <a href="#prices" className="font-black text-[#8a6a35]">
                    price finder
                  </a>
                  .
                </div>
              </div>
              <div className="mt-[22px] flex items-center justify-between gap-5">
                <div className="flex gap-1.5">
                  {STORIES.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => showStory(i)}
                      aria-label={`Go to story image ${i + 1}`}
                      className={`h-[5px] w-[27px] rounded-full ${i === storyIdx ? "bg-ink" : "bg-[#d8ddd6]"}`}
                    />
                  ))}
                </div>
                <div className="flex gap-[7px]">
                  <button type="button" onClick={() => showStory(storyIdx - 1)} aria-label="Previous image" className="grid h-[38px] w-[38px] place-items-center rounded-full border border-line bg-white text-ink hover:bg-ink hover:text-white">
                    ←
                  </button>
                  <button type="button" onClick={() => showStory(storyIdx + 1)} aria-label="Next image" className="grid h-[38px] w-[38px] place-items-center rounded-full border border-line bg-white text-ink hover:bg-ink hover:text-white">
                    →
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ============ PRICE FINDER ============ */}
      <section id="prices" ref={pricesRef as any} className="scroll-mt-24 py-[52px]">
        <div className="container">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.15em] text-gold uppercase">
                <span className="h-[7px] w-[7px] rounded-full bg-gold" /> Tea price finder
              </span>
              <h2 className="mt-1.5 font-serif text-4xl leading-tight tracking-[-0.03em]">Choose your tea.</h2>
            </div>
            <p className="max-w-[560px] text-sm text-muted">
              Pick the main category first. Tap the Taste chip on any card to preview its flavour before you choose — then
              select your teas in one click.
            </p>
          </div>

          <div className="rounded-[28px] border border-line bg-paper p-[22px] shadow-[0_18px_45px_rgba(23,50,38,0.10)]">
            <div className="mb-[18px] grid grid-cols-1 gap-2.5 md:grid-cols-3">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCat(c.slug);
                    setActiveGroup("All");
                    setSearch("");
                  }}
                  className={`rounded-[18px] border p-4 text-left font-black transition ${activeCat === c.slug ? "border-ink bg-ink text-white shadow-[0_10px_25px_rgba(23,50,38,0.13)]" : "border-line bg-[#faf7ef] text-ink"}`}
                >
                  {c.name}
                  <span className={`mt-[3px] block text-[11px] font-semibold ${activeCat === c.slug ? "text-[#cbd7ce]" : "text-muted"}`}>
                    {c.subtitle || TAB_SUBTITLES[c.slug] || ""}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-[17px]">
              <div className="flex flex-wrap gap-[7px]">
                {groups.map((g) => (
                  <button
                    key={g}
                    onClick={() => setActiveGroup(g)}
                    className={`rounded-full border px-3 py-2 text-xs font-extrabold ${activeGroup === g ? "border-[#cdd8c7] bg-[#e9efe5] text-ink" : "border-line bg-white text-[#5d675f]"}`}
                  >
                    {g === "All" ? "All grades" : g}
                  </button>
                ))}
              </div>
              <div className="flex flex-1 flex-wrap justify-end gap-2">
                <div className="relative w-full max-w-[280px] flex-1">
                  <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
                  <input
                    className="input"
                    placeholder="Search grades..."
                    aria-label="Search tea grades"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setSearch("");
                    }}
                    style={{ paddingLeft: 36 }}
                  />
                </div>
                <select className="select w-[178px]" aria-label="Sort grades" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="recommended">Recommended</option>
                  <option value="low">Price: Low to High</option>
                  <option value="high">Price: High to Low</option>
                  <option value="az">Grade: A–Z</option>
                </select>
              </div>
            </div>

            <div className="mt-5 mb-3.5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <span className="block text-[10px] font-black tracking-[0.12em] text-gold uppercase">Showing</span>
                <strong className="font-serif text-[28px]">{activeCatName}</strong>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2.5">
                <button type="button" onClick={toggleExpandAll} className="rounded-full border border-line bg-white px-3.5 py-[7px] text-[11px] font-black text-[#5d675f]">
                  {filtered.length > 0 && expanded.size === filtered.length ? "Collapse all" : "Expand all"}
                </button>
                <span className="text-xs font-extrabold text-muted" aria-live="polite">
                  {filtered.length} {filtered.length === 1 ? "grade" : "grades"}
                </span>
                {selected.size > 0 && (
                  <button
                    type="button"
                    onClick={() => document.getElementById("basket")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    className="inline-flex items-center gap-2 rounded-full bg-ink py-[7px] pr-[7px] pl-3.5 text-[11px] font-black text-white"
                  >
                    <span>
                      {selected.size} {selected.size === 1 ? "tea" : "teas"} selected
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Clear selected teas"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(new Set());
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setSelected(new Set());
                      }}
                      className="grid h-[19px] w-[19px] place-items-center rounded-full bg-white/20 text-[13px] leading-none"
                    >
                      ×
                    </span>
                  </button>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-line p-[45px] text-center text-muted">
                <strong className="block font-serif text-[23px] text-ink">No matching grades</strong>
                <span className="mt-1.5 block">Try another search or filter.</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveGroup("All");
                  }}
                  className="btn secondary btn mt-4"
                >
                  Clear search &amp; filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 items-start gap-[13px] sm:grid-cols-2 xl:grid-cols-4">
                {filtered.map((g) => {
                  const isOpen = expanded.has(g.gradeCode);
                  const isSel = selected.has(g.gradeCode);
                  const chips = String(g.tasteProfile || "Balanced").split(" · ");
                  return (
                    <article
                      key={g.id}
                      data-grade={g.gradeCode}
                      className={`price-card w-full rounded-[20px] border bg-white p-[19px] transition ${isSel ? "border-gold shadow-[0_14px_30px_rgba(198,154,82,0.2)]" : "border-line"} hover:-translate-y-[3px] hover:shadow-[0_12px_28px_rgba(23,50,38,0.08)]`}
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-[7px]">
                          <span className="text-[10px] font-black tracking-[0.12em] text-gold uppercase">{g.processingMethod}</span>
                          {Number(g.displayOrder) === 1 && (
                            <span className="rounded-full bg-gradient-to-br from-gold to-gold2 px-2 py-1 text-[8.5px] font-black tracking-[0.1em] whitespace-nowrap text-white uppercase">
                              ★ Top pick
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleExpand(g.gradeCode)}
                          aria-expanded={isOpen}
                          aria-label={`Show taste profile for ${g.gradeCode}`}
                          className="inline-flex flex-none items-center gap-[7px] rounded-full border border-line bg-[#faf7ef] px-3 py-1.5 text-[10.5px] font-black text-ink2"
                        >
                          <span>Taste</span>
                          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </div>
                      <h3 className="mt-1.5 font-serif text-2xl">{g.gradeCode}</h3>
                      <div className="min-h-[18px] text-[11px] text-[#7a827d]">{g.name}</div>
                      {isOpen && (
                        <div className="mt-[13px] mb-1.5 rounded-[15px] border border-[#e7e1d2] border-l-[3px] border-l-gold2 bg-[#f8f5ed] p-3.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[9px] font-black tracking-[0.12em] text-gold uppercase">Taste</span>
                            <span className="flex flex-wrap gap-[5px]">
                              {chips.map((t: string) => (
                                <span key={t} className="rounded-full border border-[#e7d7b5] bg-[#f3ead7] px-2.5 py-1 text-[10.5px] font-black text-[#7c6233]">
                                  {t}
                                </span>
                              ))}
                            </span>
                          </div>
                          <p className="mt-2 text-[11.5px] leading-relaxed text-[#5d675f]">{g.description}</p>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-[11px] border border-line bg-white px-2.5 py-2">
                              <span className="block text-[8.5px] font-black tracking-[0.1em] text-muted uppercase">Cup colour</span>
                              <strong className="text-[11.5px]">{g.cupColour || "—"}</strong>
                            </div>
                            <div className="rounded-[11px] border border-line bg-white px-2.5 py-2">
                              <span className="block text-[8.5px] font-black tracking-[0.1em] text-muted uppercase">Best for</span>
                              <strong className="text-[11.5px]">{g.bestFor || "—"}</strong>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleSelect(g.gradeCode)}
                            className={`mt-3 w-full rounded-full border-[1.5px] border-dashed border-gold bg-[#fdf9ef] p-2 text-[11px] font-black text-[#8a6a35] ${isSel ? "border-solid border-ink bg-ink text-white" : ""}`}
                          >
                            {isSel ? "✓ Selected" : "Select this tea"}
                          </button>
                        </div>
                      )}
                      <div className="mt-[18px] text-[29px] font-black tracking-[-0.02em]">{rs(Number(g.pricePerKg))}</div>
                      <div className="text-[11px] text-muted">per kilogram</div>
                      <div className="mt-3.5 flex justify-between gap-2.5 border-t border-line pt-2.5 text-[11px]">
                        <span>
                          100g <strong>{rs(Number(g.pricePerKg) / 10)}</strong>
                        </span>
                        <span className={`badge ${availabilityClass(g.availability)}`}>{availabilityLabel(g.availability)}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-[7px] text-[10px] text-[#7b847e]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#70a174] shadow-[0_0_0_4px_rgba(112,161,116,0.12)]" />
                        Updated today
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {basketItems.length > 0 && (
              <div id="basket" className="mt-4 overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_10px_26px_rgba(23,50,38,0.06)]">
                <div className="flex items-center justify-between gap-3 bg-ink px-4 py-3 text-white">
                  <strong className="font-serif text-[19px] font-semibold">
                    Your selection · {basketItems.length}
                  </strong>
                  <button type="button" onClick={() => setSelected(new Set())} className="rounded-full border border-white/25 bg-white/15 px-3 py-[7px] text-[10.5px] font-black tracking-[0.04em]">
                    Clear all
                  </button>
                </div>
                <div className="px-4 pt-1 pb-4">
                  {basketItems.map((g) => (
                    <div key={g.id} className="flex items-center justify-between gap-2.5 rounded-xl border-b border-line px-2.5 py-3 hover:bg-[#faf7ef]">
                      <button type="button" onClick={() => jumpToCard(g.gradeCode)} aria-label={`Show ${g.gradeCode} in the price grid`} className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
                        <div className="min-w-0">
                          <div className="text-[13px] font-black">{g.gradeCode}</div>
                          <div className="mt-0.5 text-[10.5px] text-muted">
                            {g.name} · {g.processingMethod}
                          </div>
                        </div>
                        <div className="text-[13px] font-black whitespace-nowrap">
                          {rs(Number(g.pricePerKg))}
                          <span className="text-[11px] font-normal text-muted"> /kg</span>
                        </div>
                      </button>
                      <span className="text-[9px] font-black tracking-[0.08em] text-gold uppercase">View ↗</span>
                      <button
                        type="button"
                        onClick={() => toggleSelect(g.gradeCode)}
                        aria-label={`Remove ${g.gradeCode} from selection`}
                        className="h-[26px] w-[26px] flex-none rounded-full border border-[#e5cdc2] bg-[#fdf7f4] text-xs text-danger"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5">
                    <span className="text-[9px] font-black tracking-[0.1em] text-gold uppercase">Selection totals</span>
                    <span>
                      <strong className="text-xl font-black">{rs(basketKg)}</strong>
                      <span className="text-[11px] text-muted"> /kg</span>&nbsp;&nbsp;
                      <strong className="text-xl font-black">{rs(basketKg / 10)}</strong>
                      <span className="text-[11px] text-muted"> /100g</span>
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    <a href={basketMail} className="btn primary btn text-xs">
                      Send enquiry by email →
                    </a>
                    <Link to="/about" className="btn secondary btn text-xs">
                      Contact the tea centre
                    </Link>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ============ GRADE GUIDE ============ */}
      <section id="grades" className="scroll-mt-24 py-[52px]">
        <div className="container">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.15em] text-gold uppercase">
                <span className="h-[7px] w-[7px] rounded-full bg-gold" /> Explore the leaf
              </span>
              <h2 className="mt-1.5 font-serif text-4xl leading-tight tracking-[-0.03em]">Popular grade guide.</h2>
            </div>
            <p className="max-w-[560px] text-sm text-muted">
              Plain-language explanations of the familiar grades. Tap any card to open that grade in the price finder.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-[13px] sm:grid-cols-2 xl:grid-cols-4">
            {GUIDE_CARDS.map((c) => (
              <article key={c.grade} className="min-h-[178px] rounded-[20px] border border-line bg-paper p-5">
                <div className="text-[9px] font-black tracking-[0.1em] text-gold uppercase">{c.num}</div>
                <h3 className="mt-2 font-serif text-[25px]">{c.grade}</h3>
                <p className="mt-0 mb-[15px] text-xs text-muted">{c.desc}</p>
                <button type="button" onClick={() => openGradeInFinder(c.cat, c.grade)} className="text-[11px] font-black text-ink hover:text-gold">
                  View in price finder →
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CALCULATOR + BENEFITS SIDE ============ */}
      <section className="py-[52px]">
        <div className="container grid gap-[22px] lg:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[28px] bg-ink p-8 text-white">
            <span className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.15em] text-gold uppercase">
              <span className="h-[7px] w-[7px] rounded-full bg-gold" /> Simple price math
            </span>
            <h2 className="mt-2 font-serif text-[35px] leading-tight">See any gram price instantly.</h2>
            <p className="text-[13px] text-[#cbd6ce]">
              Choose a category, pick a grade and its kilogram price fills in automatically — then set any amount in grams.
            </p>
            <div className="mt-[19px] grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="calcCategory" className="block text-[9px] font-black tracking-[0.1em] text-[#aebdb2] uppercase">
                  Step 1 · Choose a tea category
                </label>
                <select
                  id="calcCategory"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#264535] p-3 text-white outline-none"
                  value={calcCat}
                  onChange={(e) => setCalcCat(e.target.value)}
                >
                  <option value="" disabled>
                    Choose a category…
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="teaPreset" className="block text-[9px] font-black tracking-[0.1em] text-[#aebdb2] uppercase">
                  Step 2 · Choose the tea grade
                </label>
                <select
                  id="teaPreset"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#264535] p-3 text-white outline-none disabled:opacity-50"
                  value={calcGrade}
                  disabled={!calcTeas.length}
                  onChange={(e) => pickCalcGrade(e.target.value)}
                >
                  {!calcTeas.length && <option value="">Choose a category first</option>}
                  {calcTeas.map((t, i) => (
                    <option key={t.id} value={t.gradeCode}>
                      {t.gradeCode} — {rs(Number(t.pricePerKg))} /kg{i === 0 ? " ★ top pick" : ""}
                    </option>
                  ))}
                  {calcTeas.length > 0 && <option value="__custom">Custom price — type your own</option>}
                </select>
                {calcTea && calcGrade !== "__custom" && (
                  <div className="mt-2 flex items-center gap-2 text-[10.5px] font-extrabold text-gold2">
                    <span className="h-[5px] w-[5px] flex-none rounded-full bg-gold2" />
                    <span>
                      {calcTea.processingMethod}
                      {calcTea.tasteProfile ? ` · ${calcTea.tasteProfile}` : ""}
                      {calcTea.cupColour ? ` · ${calcTea.cupColour} cup` : ""}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="kgPrice" className="block text-[9px] font-black tracking-[0.1em] text-[#aebdb2] uppercase">
                  Step 3 · Price per kg · LKR
                </label>
                <input
                  id="kgPrice"
                  type="number"
                  min={0}
                  value={kgPrice}
                  onChange={(e) => setKgPrice(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#264535] p-3 text-white outline-none"
                />
              </div>
              <div>
                <label htmlFor="grams" className="block text-[9px] font-black tracking-[0.1em] text-[#aebdb2] uppercase">
                  Step 4 · Amount · grams
                </label>
                <input
                  id="grams"
                  type="number"
                  min={1}
                  value={grams}
                  onChange={(e) => setGrams(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#264535] p-3 text-white outline-none"
                />
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3 rounded-2xl bg-[#f2eee5] p-4 text-ink">
              <div>
                <small className="block text-[10px] text-muted">Calculated price</small>
                <strong className="text-[27px]">
                  Rs. {(kgPrice * grams / 1000).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
              <div>
                <small className="block text-[10px] text-muted">Unit</small>
                <strong className="text-[27px]">{grams}g</strong>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#d0d9ca] bg-[#dfe6d8] p-8">
            <span className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.15em] text-gold uppercase">
              <span className="h-[7px] w-[7px] rounded-full bg-gold" /> Why tea
            </span>
            <h2 className="mt-2 font-serif text-[35px] leading-tight">More than a refreshing cup.</h2>
            <p className="max-w-[620px] text-[13px] text-[#56645c]">
              Tea brings together natural plant compounds, hydration and a moderate caffeine lift — making it an easy drink
              to enjoy as part of your everyday routine.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[
                { icon: "☀", t: "Gentle energy", d: "Natural caffeine can help you feel more alert and focused without making the drink feel heavy." },
                { icon: "◌", t: "Rich in natural compounds", d: "Tea contains polyphenols and other plant compounds known for their antioxidant activity." },
                { icon: "◒", t: "Light & refreshing", d: "Unsweetened tea is very low in calories, giving you flavour without the sugar load of many soft drinks." },
                { icon: "↻", t: "Fits any part of the day", d: "Choose from brisk black teas, fresh green teas and delicate specialty teas to suit the moment." },
              ].map((b) => (
                <article key={b.t} className="grid grid-cols-[34px_1fr] items-start gap-2.5 rounded-[15px] border border-ink/10 bg-white/60 p-[13px]">
                  <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-[15px] font-black text-gold2">{b.icon}</span>
                  <div>
                    <strong className="mt-[1px] mb-1 block text-xs leading-snug">{b.t}</strong>
                    <span className="block text-[10.5px] leading-relaxed text-[#56645c]">{b.d}</span>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-[15px] grid gap-[3px] rounded-r-xl border-l-[3px] border-l-gold bg-white/45 px-3.5 py-3">
              <strong className="font-serif text-[15px]">Simple choice. Everyday benefit.</strong>
              <span className="text-[10.5px] leading-relaxed text-[#5d675f]">
                A cup can bring flavour, hydration and a little lift — with nothing needed except water.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BENEFITS GRID ============ */}
      <section id="benefits" className="scroll-mt-24 py-[52px]">
        <div className="container">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-5">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.15em] text-gold uppercase">
                <span className="h-[7px] w-[7px] rounded-full bg-gold" /> What tea gives you
              </span>
              <h2 className="mt-1.5 font-serif text-4xl leading-tight tracking-[-0.03em]">Why drinkers come back.</h2>
            </div>
            <p className="max-w-[560px] text-sm text-muted">
              Beyond the taste — the quiet benefits and the interesting numbers behind every cup of Ceylon tea, in plain
              language.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-[13px] md:grid-cols-2 xl:grid-cols-4">
            {[
              { tag: "01 · Steady focus", t: "Calm alertness, no crash", d: "Tea's gentle caffeine travels with L-theanine, an amino acid that smooths the lift — clear, settled focus that lasts, without the coffee jitters or the mid-afternoon dip." },
              { tag: "02 · Antioxidants", t: "A cup full of flavonoids", d: "Ceylon tea is naturally rich in polyphenol antioxidants — the family of compounds studied for supporting heart health and helping the body cope with everyday stress." },
              { tag: "03 · Light & refreshing", t: "Flavour, almost zero calories", d: "Plain tea is virtually calorie-free and mostly water — a naturally hydrating ritual that refreshes without sugar or additives. Straight, with lemon, or with a splash of milk." },
              { tag: "04 · All-day ritual", t: "One for every hour", d: "Brisk black at breakfast, soft green after lunch, silver tips for slow evenings — tea's gentler caffeine curve fits the whole day. A small, repeatable pleasure." },
            ].map((b) => (
              <article key={b.tag} className="rounded-[20px] border border-line bg-paper p-[22px] shadow-[0_10px_26px_rgba(23,50,38,0.05)]">
                <span className="inline-block text-[9px] font-black tracking-[0.12em] text-gold uppercase">{b.tag}</span>
                <h3 className="mt-2 mb-2 font-serif text-[21px] leading-tight">{b.t}</h3>
                <p className="m-0 text-xs leading-relaxed text-[#5d675f]">{b.d}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 text-center text-[13px] text-[#5d675f]">
            Ready to feel it yourself?{" "}
            <a href="#prices" className="font-black text-[#8a6a35]">
              Find your grade →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
