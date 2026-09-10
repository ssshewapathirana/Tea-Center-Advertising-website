import { describe, it, expect, beforeAll, afterAll } from "vitest";

const BASE = "http://localhost:3001";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  return res.json();
}

let serverProc: any;

beforeAll(async () => {
  const { spawn } = await import("child_process");
  serverProc = spawn("node", ["node_modules/tsx/dist/cli.mjs", "server/index.ts"], {
    cwd: process.cwd(),
    stdio: "pipe",
    env: { ...process.env, VITE_DEV_SERVER_URL: "http://localhost:5173" },
  });
  await new Promise((r) => setTimeout(r, 6000));
}, 20000);

afterAll(() => {
  if (serverProc) serverProc.kill();
});

describe("Health endpoint", () => {
  it("GET /api/health returns ok", async () => {
    const res = await api("/api/health");
    expect(res.success).toBe(true);
    expect(res.data.status).toBe("ok");
  });
});

describe("Public API", () => {
  describe("GET /api/public/categories", () => {
    it("returns categories", async () => {
      const res = await api("/api/public/categories");
      expect(res.success).toBe(true);
      expect(res.data.length).toBeGreaterThanOrEqual(3);
    });

    it("categories have required fields", async () => {
      const res = await api("/api/public/categories");
      const cat = res.data[0];
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("name");
      expect(cat).toHaveProperty("slug");
      expect(cat).toHaveProperty("displayOrder");
      expect(cat).toHaveProperty("isActive");
    });

    it("only returns active categories", async () => {
      const res = await api("/api/public/categories");
      res.data.forEach((c: any) => expect(c.isActive).toBe(true));
    });
  });

  describe("GET /api/public/grades", () => {
    it("returns published grades", async () => {
      const res = await api("/api/public/grades");
      expect(res.success).toBe(true);
      expect(res.data.length).toBeGreaterThanOrEqual(12);
    });

    it("grades have price data", async () => {
      const res = await api("/api/public/grades");
      res.data.forEach((g: any) => {
        expect(g).toHaveProperty("pricePerKg");
        expect(Number(g.pricePerKg)).toBeGreaterThan(0);
      });
    });

    it("filters by category", async () => {
      const res = await api("/api/public/grades?category=black-tea");
      expect(res.data.length).toBe(6);
      res.data.forEach((g: any) => expect(g.categorySlug).toBe("black-tea"));
    });

    it("searches by grade code", async () => {
      const res = await api("/api/public/grades?search=BOP");
      expect(res.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("GET /api/public/grades/:slug", () => {
    it("returns BOP grade detail", async () => {
      const res = await api("/api/public/grades/bop");
      expect(res.success).toBe(true);
      expect(res.data.gradeCode).toBe("BOP");
      expect(res.data.name).toBe("Broken Orange Pekoe");
      expect(Number(res.data.pricePerKg)).toBe(1280);
    });

    it("returns 404 for unknown slug", async () => {
      const res = await api("/api/public/grades/nonexistent");
      expect(res.success).toBe(false);
    });
  });

  describe("GET /api/public/stats", () => {
    it("returns total grades, min price, avg price", async () => {
      const res = await api("/api/public/stats");
      expect(res.success).toBe(true);
      expect(res.data.totalGrades).toBeGreaterThanOrEqual(12);
      expect(res.data.minPrice).toBe(1090);
      expect(res.data.avgPrice).toBeGreaterThan(0);
    });
  });
});

describe("Authentication", () => {
  it("POST /api/auth/login with valid credentials returns token", async () => {
    const res = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@newbergtea.com", password: "NewbergAdmin2026!" }),
    });
    expect(res.success).toBe(true);
    expect(res.data.token).toBeDefined();
    expect(res.data.user.email).toBe("admin@newbergtea.com");
    expect(res.data.user.role).toBe("ADMIN");
  });

  it("POST /api/auth/login with wrong password fails", async () => {
    const res = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@newbergtea.com", password: "wrong" }),
    });
    expect(res.success).toBe(false);
  });

  it("POST /api/auth/login with unknown email fails", async () => {
    const res = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "nobody@example.com", password: "pass" }),
    });
    expect(res.success).toBe(false);
  });
});

describe("Admin API (requires auth)", () => {
  let authToken: string;

  beforeAll(async () => {
    const res = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@newbergtea.com", password: "NewbergAdmin2026!" }),
    });
    authToken = res.data.token;
  });

  const authHeaders = () => ({ Authorization: `Bearer ${authToken}` });

  describe("Dashboard", () => {
    it("GET /api/admin/dashboard returns stats", async () => {
      const res = await api("/api/admin/dashboard", { headers: authHeaders() });
      expect(res.success).toBe(true);
      expect(res.data.stats.totalGrades).toBeGreaterThanOrEqual(12);
      expect(res.data.stats.published).toBeGreaterThanOrEqual(12);
      expect(res.data.stats.available).toBeGreaterThan(0);
      expect(res.data.stats.totalCategories).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Categories", () => {
    it("GET /api/admin/categories returns list", async () => {
      const res = await api("/api/admin/categories", { headers: authHeaders() });
      expect(res.success).toBe(true);
      expect(res.data.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Tea listing", () => {
    it("GET /api/admin/tea returns list", async () => {
      const res = await api("/api/admin/tea", { headers: authHeaders() });
      expect(res.success).toBe(true);
      expect(res.data.length).toBeGreaterThanOrEqual(12);
    });

    it("GET /api/admin/tea?category=black-tea filters", async () => {
      const res = await api("/api/admin/tea?category=black-tea", { headers: authHeaders() });
      expect(res.success).toBe(true);
      expect(res.data.length).toBe(6);
    });
  });

  describe("Price History", () => {
    it("GET /api/admin/prices/history returns list", async () => {
      const res = await api("/api/admin/prices/history", { headers: authHeaders() });
      expect(res.success).toBe(true);
    });
  });

  describe("Activity Log", () => {
    it("GET /api/admin/activity returns entries", async () => {
      const res = await api("/api/admin/activity", { headers: authHeaders() });
      expect(res.success).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
    });

    it("activity entries have required fields", async () => {
      const res = await api("/api/admin/activity", { headers: authHeaders() });
      const entry = res.data[0];
      expect(entry).toHaveProperty("id");
      expect(entry).toHaveProperty("action");
      expect(entry).toHaveProperty("entityType");
      expect(entry).toHaveProperty("description");
      expect(entry).toHaveProperty("createdAt");
    });
  });

  describe("Authorization", () => {
    it("admin endpoints return 401 without token", async () => {
      const res = await api("/api/admin/dashboard");
      expect(res.success).toBe(false);
    });

    it("admin endpoints return 401 with invalid token", async () => {
      const res = await api("/api/admin/dashboard", {
        headers: { Authorization: "Bearer invalid-token-here" },
      });
      expect(res.success).toBe(false);
    });
  });
});

describe("Full CRUD lifecycle (creates, modifies, cleans up)", () => {
  let authToken: string;
  let createdCategoryId: string;
  let createdTeaId: string;

  beforeAll(async () => {
    const res = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@newbergtea.com", password: "NewbergAdmin2026!" }),
    });
    authToken = res.data.token;
  });

  const authHeaders = () => ({ Authorization: `Bearer ${authToken}` });

  it("creates category, then updates it", async () => {
    const createRes = await api("/api/admin/categories", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name: "Lifecycle Test Cat", slug: "lifecycle-test-cat" }),
    });
    expect(createRes.success).toBe(true);
    createdCategoryId = createRes.data.id;

    const listRes = await api("/api/admin/categories", { headers: authHeaders() });
    expect(listRes.data.some((c: any) => c.id === createdCategoryId)).toBe(true);

    const updateRes = await api(`/api/admin/categories/${createdCategoryId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ name: "Updated Lifecycle Cat" }),
    });
    expect(updateRes.success).toBe(true);
    expect(updateRes.data.name).toBe("Updated Lifecycle Cat");
  });

  it("creates tea, updates availability, toggles publish, updates price, deletes", async () => {
    const createRes = await api("/api/admin/tea", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        categoryId: createdCategoryId,
        gradeCode: "LIFECYCLE-TEST",
        name: "Lifecycle Test Tea",
        slug: "lifecycle-test",
        processingMethod: "Test",
        groupName: "Test",
        initialPrice: 5000,
      }),
    });
    expect(createRes.success).toBe(true);
    createdTeaId = createRes.data.id;

    const getRes = await api(`/api/admin/tea/${createdTeaId}`, { headers: authHeaders() });
    expect(getRes.success).toBe(true);
    expect(getRes.data.gradeCode).toBe("LIFECYCLE-TEST");

    const availRes = await api(`/api/admin/tea/${createdTeaId}/availability`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ availability: "LOW_STOCK" }),
    });
    expect(availRes.success).toBe(true);
    expect(availRes.data.availability).toBe("LOW_STOCK");

    const pubRes = await api(`/api/admin/tea/${createdTeaId}/publish`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ isPublished: false }),
    });
    expect(pubRes.success).toBe(true);
    expect(pubRes.data.isPublished).toBe(false);

    const priceRes = await api("/api/admin/prices", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ teaGradeId: createdTeaId, newPrice: 5500, reason: "lifecycle test" }),
    });
    expect(priceRes.success).toBe(true);
    expect(priceRes.data.previousPrice).toBe(5000);
    expect(Number(priceRes.data.price.pricePerKg)).toBe(5500);
    expect(priceRes.data.percentageChange).toBe(10);

    const histRes = await api("/api/admin/prices/history", { headers: authHeaders() });
    expect(histRes.success).toBe(true);
    expect(histRes.data.some((h: any) => h.teaGradeId === createdTeaId && Number(h.newPrice) === 5500)).toBe(true);

    const deleteRes = await api(`/api/admin/tea/${createdTeaId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    expect(deleteRes.success).toBe(true);

    const getAfterDelete = await api(`/api/admin/tea/${createdTeaId}`, { headers: authHeaders() });
    expect(getAfterDelete.success).toBe(false);
  });
});
