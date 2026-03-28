// src/api/api.js

// ✅ Base URL (uses environment variable from Vite)
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

// ✅ Fetch characters from backend API
export async function fetchCharacters({ q = "", limit = 24, offset = 0 }) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  const url = `${API_BASE}/api/characters?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }

  return res.json();
}

// ===============================
// Fetch single character (API)
// ===============================
export async function fetchCharacterById(id) {
  const url = `${API_BASE}/api/characters/${id}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }

  return res.json();
}

// ===============================
// Fetch single character (DB fallback)
// ===============================
export async function fetchCharacterFromDb(id) {
  const url = `${API_BASE}/characters-db/${id}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }

  return res.json();
}

// ===============================
// Ensure images are HTTPS
// ===============================
export function ensureHttps(url) {
  if (!url) return "";
  if (url.startsWith("http://")) return "https://" + url.slice(7);
  return url;
}
