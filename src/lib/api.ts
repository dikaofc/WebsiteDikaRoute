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

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Request gagal (${res.status})`);
  }
  return res.json() as Promise<T>;
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
