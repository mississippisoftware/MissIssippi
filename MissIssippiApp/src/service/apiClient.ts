function normalizeApiBase() {
  const raw = (import.meta.env.VITE_API_BASE ?? "/api").trim();

  if (!/^https?:\/\//i.test(raw) && !raw.startsWith("/")) {
    return `/${raw}`.replace(/\/$/, "");
  }

  return raw.replace(/\/$/, "");
}

const API_BASE = normalizeApiBase();

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, init);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Request failed (${response.status}): ${response.statusText}. ${body.slice(0, 200)}`
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const body = await response.text();
    throw new Error(
      `Unexpected response type for ${url} (${contentType || "unknown"}): ${body.slice(0, 200)}`
    );
  }

  return (await response.json()) as T;
}
