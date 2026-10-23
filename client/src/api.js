const apiBaseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function request(url, options) {
  const res = await fetch(`${apiBaseUrl}${url}`, options);
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export const analyzeResume = (formData) => request("/api/analyze", { method: "POST", body: formData });
export const getHistory = () => request("/api/analyses");
export const getAnalysis = (id) => request(`/api/analyses/${id}`);
export const deleteAnalysis = (id) => request(`/api/analyses/${id}`, { method: "DELETE" });
