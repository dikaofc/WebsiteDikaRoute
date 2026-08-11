export interface ChangelogRelease {
  version: string;
  date: string;
  sections: { name: string; items: string[] }[];
}

export interface ChangelogResponse {
  total: number;
  releases: ChangelogRelease[];
  source: "github" | "local" | "cache";
  fetchedAt: string | null;
  nextRefreshInMs: number;
}

export interface VersionInfo {
  version: string;
  source: "github" | "local" | "cache";
  publishedAt?: string | null;
}

export interface News {
  active: boolean;
  title: string;
  message: string;
  link?: string;
  linkLabel?: string;
  icon?: string;
}

export interface Stats {
  providers: number;
  strategies: number;
  compressionEngines: number;
  avgOverheadMs: number;
  githubStars: number;
  npmDownloads: number;
}

export interface Issue {
  id: string;
  title: string;
  type: "bug" | "feature" | "question" | "docs" | "other";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  steps: string;
  environment: string;
  status: "open" | "in-progress" | "resolved";
  votes: number;
  createdAt: string;
}

export interface IssuesResponse {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  issues: Issue[];
}

const CF_CHALLENGE_RE =
  /cf-mitigated|challenge-platform|cf-chl-|Just a moment|Checking your browser|turnstile/i;
const CF_CHALLENGE_MSG =
  "Terkena proteksi Cloudflare (Bot Fight Mode) di domain — nonaktifkan Bot Fight Mode atau tambahkan WAF rule khusus /api/* di dashboard Cloudflare.";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  // JANGAN kirim Content-Type pada GET — header itu non-standar untuk GET
  // dan bisa memicu deteksi bot Cloudflare. Content-Type hanya dipakai saat
  // ada body (POST/PUT).
  const hasBody = Boolean(init?.body);
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    ...init,
  });

  const text = await res.text();
  const parseJson = (): { ok: true; data: unknown } | { ok: false } => {
    if (!text.trim()) return { ok: false };
    try {
      return { ok: true, data: JSON.parse(text) };
    } catch {
      return { ok: false };
    }
  };

  if (!res.ok) {
    if (CF_CHALLENGE_RE.test(text)) throw new Error(CF_CHALLENGE_MSG);
    const body = parseJson();
    const err = body.ok ? (body.data as { error?: string } | null)?.error : undefined;
    throw new Error(err || `Request gagal (${res.status})`);
  }

  // PENTING (akar masalah halaman blank): bila server membalas 2xx tapi body
  // BUKAN JSON — mis. halaman challenge Cloudflare atau index.html SPA fallback
  // yang keliru disajikan untuk /api/* — kita LEMPAR error tegas, bukan
  // diam-diam mengembalikan objek kosong. Objek kosong membuat pemanggil
  // membaca properti undefined (mis. res.issues) → crash render → blank.
  const body = parseJson();
  if (!body.ok) {
    if (CF_CHALLENGE_RE.test(text)) throw new Error(CF_CHALLENGE_MSG);
    throw new Error("Respons server tidak valid — muat ulang halaman.");
  }
  return body.data as T;
}

export const api = {
  health: () => request<{ status: string; version: string; uptime: number }>("/api/health"),
  news: () => request<News>("/api/news"),
  changelog: () => request<ChangelogResponse>("/api/changelog"),
  version: () => request<VersionInfo>("/api/version"),
  stats: () => request<Stats>("/api/stats"),
  contact: (payload: { name: string; email: string; message: string }) =>
    request<{ ok: boolean; message: string }>("/api/contact", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  newsletter: (email: string) =>
    request<{ ok: boolean; message: string }>("/api/newsletter", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  newsletterCount: () => request<{ total: number }>("/api/newsletter"),
  unsubscribe: (email: string) =>
    request<{ ok: boolean; removed: number; message: string }>("/api/newsletter/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  donation: (payload: {
    name: string;
    email: string;
    amount: number;
    frequency: string;
    method: string;
    message?: string;
  }) =>
    request<{ ok: boolean; message: string }>("/api/donation", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  donationConfirm: (payload: { name?: string; email?: string; message?: string }) =>
    request<{ ok: boolean; emailSent: boolean; message: string }>("/api/donation/confirm", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  donationPay: (payload: {
    name: string;
    email: string;
    amount: number;
    frequency: string;
    method: "saweria" | "qris";
    message?: string;
  }) =>
    request<{
      ok: boolean;
      id: string;
      transactionId: string;
      qrDataUrl: string;
      amount: number;
      expiresInMs: number;
      message: string;
    }>("/api/donation/pay", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  donationStatus: (transactionId: string) =>
    request<{ ok: boolean; paid: boolean; status: "pending" | "paid" | "expired" }>(
      `/api/donation/status/${encodeURIComponent(transactionId)}`
    ),
  playgroundStatus: () => request<{ available: boolean; reason?: string }>("/api/playground/status"),
  issues: () => request<IssuesResponse>("/api/issues"),
  reportIssue: (payload: {
    title: string;
    type: string;
    severity: string;
    description: string;
    steps?: string;
    environment?: string;
    email?: string;
  }) =>
    request<{ ok: boolean; id: string; message: string }>("/api/issues", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  voteIssue: (id: string) =>
    request<{ ok: boolean; votes: number }>(`/api/issues/${id}/vote`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
};
