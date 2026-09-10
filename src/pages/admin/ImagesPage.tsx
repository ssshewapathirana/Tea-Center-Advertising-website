import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const SECTIONS = [
  { id: "hero", label: "Hero banner", desc: "Image for the right side of the homepage hero section." },
  { id: "story-0", label: "Story slide 1 — In the garden", desc: "Image for the first story slide." },
  { id: "story-1", label: "Story slide 2 — In the factory", desc: "Image for the second story slide." },
  { id: "story-2", label: "Story slide 3 — Graded & tasted", desc: "Image for the third story slide." },
];

function validateImageUrl(url: string): string | null {
  if (!url.trim()) return null;
  try { new URL(url); } catch { return "Invalid URL format."; }
  if (/drive\.google\.com\/drive\/folders\//i.test(url)) return "This is a Google Drive FOLDER link. It cannot display as an image. Open the image file inside the folder, right-click → \"Open image in new tab\" → copy THAT URL.";
  if (/drive\.google\.com\/drive\/u\//i.test(url)) return "This is a Google Drive folder URL. Open the specific image file, then right-click → \"Open image in new tab\" → copy that URL.";
  return null;
}

export default function ImagesPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [addingSection, setAddingSection] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api.getAdminImages().then(setImages).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const getImages = (section: string) =>
    images.filter((i) => i.section === section).sort((a, b) => a.displayOrder - b.displayOrder);

  const handleUrlChange = (val: string) => {
    setUrl(val);
    setUrlError(validateImageUrl(val));
  };

  const handleAdd = async () => {
    if (!addingSection || !url.trim()) return;
    const err = validateImageUrl(url);
    if (err) { setUrlError(err); return; }
    try {
      const sectionImages = getImages(addingSection);
      await api.addImage({
        section: addingSection,
        imageUrl: url.trim(),
        alt: alt.trim(),
        displayOrder: sectionImages.length,
      });
      setToast("Image added.");
      setAddingSection(null);
      setUrl("");
      setAlt("");
      setUrlError(null);
      load();
    } catch (err: any) {
      setToast("Error: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this image?")) return;
    try {
      await api.deleteImage(id);
      setToast("Image removed.");
      load();
    } catch (err: any) {
      setToast("Error: " + err.message);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await api.updateImage(id, { isActive: !isActive });
      load();
    } catch (err: any) {
      setToast("Error: " + err.message);
    }
  };

  return (
    <div>
      <div className="section-head">
        <div><span className="eyebrow">Image management</span><h2>Homepage images.</h2></div>
        <p>Paste a direct image URL for each section. Images display on the public homepage.</p>
      </div>

      {loading ? <div className="spinner" style={{ margin: "40px auto" }} /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {SECTIONS.map((sec) => {
            const items = getImages(sec.id);
            return (
              <div key={sec.id} className="panel" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 900, color: "var(--ink)", margin: 0 }}>{sec.label}</h3>
                    <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0" }}>{sec.desc}</p>
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>{items.length} image{items.length !== 1 ? "s" : ""}</span>
                  </div>
                  <button className="btn" onClick={() => { setAddingSection(sec.id); setUrl(""); setAlt(""); setUrlError(null); }}>＋ Add URL</button>
                </div>

                {items.length === 0 ? (
                  <div style={{ border: "1px dashed var(--line)", borderRadius: 10, padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 11 }}>
                    No images yet. Click "Add URL" to add one.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((img, idx) => (
                      <div key={img.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--paper)" }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: "var(--muted)", minWidth: 16 }}>{idx + 1}.</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {img.imageUrl}
                          </div>
                          {img.alt && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>Alt: {img.alt}</div>}
                        </div>
                        <div style={{ width: 56, height: 40, borderRadius: 4, border: "1px solid var(--line)", background: "#e8e3d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "var(--muted)", textAlign: "center", overflow: "hidden" }}>
                          {img.imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i) ? (
                            <img src={img.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span>URL</span>
                          )}
                        </div>
                        <button className="icon-btn" title={img.isActive ? "Hide" : "Show"} onClick={() => handleToggle(img.id, img.isActive)}>
                          {img.isActive ? "◉" : "◌"}
                        </button>
                        <button className="icon-btn" title="Remove" onClick={() => handleDelete(img.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {addingSection && (
        <div className="modal-backdrop open" onClick={() => { setAddingSection(null); setUrl(""); setAlt(""); setUrlError(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-head">
              <h3>Add image — {SECTIONS.find((s) => s.id === addingSection)?.label}</h3>
              <button onClick={() => { setAddingSection(null); setUrl(""); setAlt(""); setUrlError(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="field-group full">
                <label>Image URL</label>
                <input
                  className="field"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="Paste a direct image URL…"
                  autoFocus
                  style={urlError ? { borderColor: "var(--danger)" } : {}}
                />
                {urlError && (
                  <div style={{ fontSize: 10, color: "var(--danger)", marginTop: 6, padding: "8px 10px", background: "#fdf2ef", borderRadius: 6, lineHeight: 1.5 }}>
                    ⚠ {urlError}
                  </div>
                )}
                {!urlError && (
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6, lineHeight: 1.6 }}>
                    <strong>Works:</strong> Direct image URLs (.jpg, .png, .webp) — Unsplash, Imgur, any public image hosting.<br />
                    <strong>Google Drive:</strong> Open image → right-click → <em>Open image in new tab</em> → copy URL from address bar.
                  </div>
                )}
              </div>
              <div className="field-group full" style={{ marginTop: 10 }}>
                <label>Alt text</label>
                <input
                  className="field"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="Describe the image (optional)"
                />
              </div>
              {url && !urlError && url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i) && (
                <div style={{ marginTop: 12, borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)" }}>
                  <img src={url} alt={alt} style={{ width: "100%", maxHeight: 200, objectFit: "contain", background: "#e8e3d8" }} />
                </div>
              )}
              {url && !urlError && !url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i) && (
                <div style={{ marginTop: 12, borderRadius: 8, padding: 12, border: "1px solid var(--line)", background: "#fffaf0", fontSize: 10, color: "#786745" }}>
                  Preview not available for this URL type. The image will still display on the homepage if the URL is a direct image link.
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => { setAddingSection(null); setUrl(""); setAlt(""); setUrlError(null); }}>Cancel</button>
              <button className="btn primary" onClick={handleAdd} disabled={!url.trim() || !!urlError}>Add image</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast show" style={{ position: "fixed", right: 20, bottom: 20, zIndex: 150, background: "var(--ink)", color: "#fff", padding: "12px 15px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>{toast}</div>}
    </div>
  );
}
