export function rs(n: number): string {
  return "Rs. " + Number(n).toLocaleString("en-LK", { maximumFractionDigits: 0 });
}

export function rsExact(n: number): string {
  return "Rs. " + Number(n).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function pctChange(oldVal: number, newVal: number): { text: string; direction: "up" | "down" | "same" } {
  if (!oldVal || oldVal === 0) return { text: "N/A", direction: "same" };
  const pct = ((newVal - oldVal) / oldVal) * 100;
  if (pct === 0) return { text: "No change", direction: "same" };
  const dir = pct > 0 ? "up" : "down";
  return { text: `${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`, direction: dir };
}

export function availabilityLabel(a: string): string {
  switch (a) {
    case "AVAILABLE": return "Available";
    case "LOW_STOCK": return "Low stock";
    case "OUT_OF_STOCK": return "Out of stock";
    default: return a;
  }
}

export function availabilityClass(a: string): string {
  switch (a) {
    case "AVAILABLE": return "badge-available";
    case "LOW_STOCK": return "badge-low-stock";
    case "OUT_OF_STOCK": return "badge-out-of-stock";
    default: return "";
  }
}

export function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
