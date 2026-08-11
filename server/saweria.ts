/**
 * Saweria QRIS — port TypeScript dari library Python `saweriaqris` (nindtz).
 *
 * Alur (sama persis dengan versi Python, diimplementasikan ulang untuk Node):
 *   1. GET https://saweria.co/{username}  → ambil user_id dari script __NEXT_DATA__
 *   2. POST https://backend.saweria.co/donations/{user_id} → dapat qr_string + id
 *   3. GET  https://backend.saweria.co/donations/qris/{id} → paid bila qr_string kosong
 *
 * CATATAN: memakai automation pada akun Saweria berisiko dibanned oleh Saweria
 * (lihat peringatan di repo asli). Aktifkan hanya bila diperlukan.
 */

const BACKEND = "https://backend.saweria.co";
const FRONTEND = "https://saweria.co";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15";

export interface SaweriaPayment {
  qrString: string;
  transactionId: string;
  userDisplayName?: string;
}

export interface SaweriaConfig {
  username: string;
  mock: boolean;
  disabled: boolean;
}

export function saweriaConfig(): SaweriaConfig {
  return {
    username: (process.env.SAWERIA_USERNAME || "dikatech").trim(),
    mock: process.env.SAWERIA_MOCK === "1",
    disabled: process.env.SAWERIA_DISABLED === "1",
  };
}

function mockPayment(message: string): SaweriaPayment {
  // Bila pesan mengandung "__PAID__", transaksi langsung dianggap lunas
  // (hanya untuk pengujian E2E di mode mock).
  const paid = String(message ?? "").includes("__PAID__");
  const tx = `mock-${crypto.randomUUID()}${paid ? ":paid" : ""}`;
  return {
    qrString: `00020101021126620014ID.CO.QRIS.WWW011893600614${tx}02080000000000030304UMI51440014ID.CO.QRIS.WWW0215ID1020015545${tx}5204539953033605802ID5909DIKAROUTE6008JAKARTA6105123456304ABCD`,
    transactionId: tx,
    userDisplayName: "DikaRoute (mock)",
  };
}

/** Ekstrak JSON dari <script id="__NEXT_DATA__"> di halaman profil Saweria. */
function extractNextData(html: string): Record<string, unknown> | null {
  // Toleran terhadap urutan atribut: cukup id="__NEXT_DATA__" ada di dalam tag.
  const m = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try {
    return JSON.parse(m[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function getUserId(username: string): Promise<string> {
  const res = await fetch(`${FRONTEND}/${username}`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Saweria profile tidak bisa diakses (HTTP ${res.status})`);

  const html = await res.text();
  const nextData = extractNextData(html);
  const pageProps = nextData?.props as { pageProps?: { data?: { id?: string } } } | undefined;
  const userId = pageProps?.pageProps?.data?.id;

  if (!userId) throw new Error("Akun Saweria tidak ditemukan (cek SAWERIA_USERNAME)");
  return userId;
}

/**
 * Buat kode pembayaran QRIS baru. `amount` minimal Rp10.000 (batas Saweria).
 * Mengembalikan string QR (untuk digambar menjadi QR code) + transaction id.
 */
export async function createPaymentQr(input: {
  username: string;
  amount: number;
  sender: string;
  email: string;
  message: string;
}): Promise<SaweriaPayment> {
  const { username, amount, sender, email, message } = input;

  if (!username || !amount || !sender || !email) {
    throw new Error("Parameter Saweria tidak lengkap");
  }
  if (amount < 10_000) {
    throw new Error("Nominal minimum donasi Saweria adalah Rp10.000");
  }

  const userId = await getUserId(username);

  const payload = {
    agree: true,
    notUnderage: true,
    message: String(message ?? "").slice(0, 100),
    amount: Math.round(Number(amount)),
    payment_type: "qris",
    vote: "",
    currency: "IDR",
    customer_info: {
      first_name: String(sender).slice(0, 50),
      email: String(email).slice(0, 120),
      phone: "",
    },
  };

  const res = await fetch(`${BACKEND}/donations/${userId}`, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });

  const body = (await res.json().catch(() => null)) as { data?: { qr_string?: string; id?: string } } | null;
  const data = body?.data;
  if (!res.ok || !data?.qr_string || !data?.id) {
    throw new Error(`Saweria menolak pembayaran (HTTP ${res.status})`);
  }

  return { qrString: data.qr_string, transactionId: data.id };
}

/**
 * Cek status pembayaran. `true` = sudah dibayar (qr_string menghilang),
 * `false` = masih menunggu. Melempar error bila transaction id tidak dikenal.
 */
export async function paidStatus(transactionId: string): Promise<boolean> {
  const res = await fetch(`${BACKEND}/donations/qris/${encodeURIComponent(transactionId)}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error("Transaction ID tidak ditemukan di Saweria");

  const body = (await res.json().catch(() => null)) as { data?: { qr_string?: string } } | null;
  const qrString = body?.data?.qr_string;
  if (qrString === undefined) throw new Error("Respon Saweria tidak valid");
  return qrString === "";
}

/** Entry point ramah-mode-tes: bila SAWERIA_MOCK=1, tidak menyentuh jaringan. */
export async function createPaymentQrSafe(input: {
  username: string;
  amount: number;
  sender: string;
  email: string;
  message: string;
}): Promise<SaweriaPayment> {
  const cfg = saweriaConfig();
  if (cfg.disabled) throw Object.assign(new Error("Pembayaran Saweria dinonaktifkan"), { code: "DISABLED" });
  if (cfg.mock) return mockPayment(input.message);
  return createPaymentQr(input);
}

export async function paidStatusSafe(transactionId: string): Promise<boolean> {
  const cfg = saweriaConfig();
  if (cfg.disabled) throw Object.assign(new Error("Pembayaran Saweria dinonaktifkan"), { code: "DISABLED" });
  if (cfg.mock) {
    // Di mode mock: transaksi terbayar bila id mengandung ":paid" (dipakai E2E).
    return transactionId.endsWith(":paid");
  }
  return paidStatus(transactionId);
}
