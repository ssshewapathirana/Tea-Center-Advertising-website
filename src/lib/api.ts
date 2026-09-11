const BASE = import.meta.env.VITE_API_URL || "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${url}`, { ...options, headers: { ...headers, ...options?.headers }, credentials: "include" });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Request failed");
  return json.data;
}

export const api = {
  // Public
  getCategories: () => request<any[]>("/public/categories"),
  getGrades: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<any[]>(`/public/grades${qs}`);
  },
  getGradeBySlug: (slug: string) => request<any>(`/public/grades/${slug}`),
  getStats: () => request<{ totalGrades: number; minPrice: number; avgPrice: number }>("/public/stats"),

  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<any>("/auth/logout", { method: "POST" }),
  getMe: () => request<{ user: any }>("/auth/me"),

  // Admin - Dashboard
  getDashboard: () => request<any>("/admin/dashboard"),

  // Admin - Tea
  getAdminTea: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<any[]>(`/admin/tea${qs}`);
  },
  getAdminTeaById: (id: string) => request<any>(`/admin/tea/${id}`),
  createTea: (data: any) => request<any>("/admin/tea", { method: "POST", body: JSON.stringify(data) }),
  updateTea: (id: string, data: any) => request<any>(`/admin/tea/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTea: (id: string) => request<any>(`/admin/tea/${id}`, { method: "DELETE" }),
  updateAvailability: (id: string, availability: string) =>
    request<any>(`/admin/tea/${id}/availability`, { method: "PATCH", body: JSON.stringify({ availability }) }),
  updatePublish: (id: string, isPublished: boolean) =>
    request<any>(`/admin/tea/${id}/publish`, { method: "PATCH", body: JSON.stringify({ isPublished }) }),

  // Admin - Categories
  getAdminCategories: () => request<any[]>("/admin/categories"),
  createCategory: (data: any) => request<any>("/admin/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => request<any>(`/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Admin - Prices
  getAdminPrices: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<any[]>(`/admin/prices${qs}`);
  },
  updatePrice: (data: any) => request<any>("/admin/prices", { method: "POST", body: JSON.stringify(data) }),
  bulkUpdatePrices: (data: any) => request<any>("/admin/prices/bulk", { method: "POST", body: JSON.stringify(data) }),
  getPriceHistory: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<any[]>(`/admin/prices/history${qs}`);
  },

  // Admin - Activity
  getActivity: () => request<any[]>("/admin/activity"),

  // Admin - Settings
  getSettings: () => request<Record<string, string>>("/admin/settings"),
  updateSettings: (data: Record<string, string>) =>
    request<any>("/admin/settings", { method: "PUT", body: JSON.stringify(data) }),

  // Admin - Images
  getAdminImages: () => request<any[]>("/admin/images"),
  addImage: (data: { section: string; imageUrl: string; alt?: string; caption?: string; displayOrder?: number }) =>
    request<any>("/admin/images", { method: "POST", body: JSON.stringify(data) }),
  updateImage: (id: string, data: any) => request<any>(`/admin/images/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteImage: (id: string) => request<any>(`/admin/images/${id}`, { method: "DELETE" }),
  getPublicImages: () => request<any[]>("/images"),
};
