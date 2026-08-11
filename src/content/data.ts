import {
  Workflow,
  ShieldCheck,
  Brain,
  Zap,
  Plug,
  Gauge,
  Lock,
  Container,
  TerminalSquare,
  RefreshCcw,
  BarChart3,
  Webhook,
} from "lucide-react";

export const NAV_LINKS = [
  { label: "Fitur", href: "/fitur" },
  { label: "Arsitektur", href: "/arsitektur" },
  { label: "Dokumentasi", href: "/docs" },
  { label: "FAQ", href: "/faq" },
  { label: "Changelog", href: "/changelog" },
  { label: "Playground", href: "/playground" },
  { label: "Forum", href: "/forum" },
  { label: "Donasi", href: "/donasi" },
];

export const FEATURES = [
  {
    icon: Workflow,
    tone: "indigo" as const,
    title: "Intelligent Routing",
    description:
      "Priority, round-robin, health-based, model-based, hingga custom rules — pilih strategi yang pas untuk workload Anda.",
  },
  {
    icon: ShieldCheck,
    tone: "emerald" as const,
    title: "Automatic Fallback",
    description:
      "Rate limit, outage, atau kuota habis? Request otomatis pindah ke provider sehat berikutnya — tanpa perubahan aplikasi.",
  },
  {
    icon: Brain,
    tone: "pink" as const,
    title: "Context Compression",
    description:
      "Engine RTK & CCR memangkas token percakapan panjang hingga hemat biaya, dengan prefix freezing untuk caching.",
  },
  {
    icon: Zap,
    tone: "amber" as const,
    title: "Performance Focused",
    description:
      "Overhead proxy minimal, koneksi reuse, dan arsitektur ringan — latensi tambahan hanya ±0.5ms.",
  },
  {
    icon: Plug,
    tone: "cyan" as const,
    title: "OpenAI Compatible",
    description:
      "Drop-in untuk apa pun yang berbicara OpenAI API — Claude Code, Cursor, aplikasi kustom, dan agen AI.",
  },
  {
    icon: Gauge,
    tone: "indigo" as const,
    title: "Dashboard & Monitoring",
    description:
      "Status provider, statistik request, token usage, latensi, error tracking, dan manajemen konfigurasi.",
  },
  {
    icon: Lock,
    tone: "pink" as const,
    title: "Security First",
    description:
      "Secret terenkripsi, SSRF guard, prompt-injection guard, PII sanitizer, credential masking, rate limit & budget.",
  },
  {
    icon: Container,
    tone: "cyan" as const,
    title: "Docker Native",
    description:
      "Image resmi, docker-compose untuk dev, dan docker-compose.prod.yml untuk produksi dengan port terpisah.",
  },
  {
    icon: TerminalSquare,
    tone: "emerald" as const,
    title: "CLI Ecosystem",
    description:
      "Setup satu-perintah untuk Claude Code, Codex, Cursor, Cline, Continue, Roo, Goose, Qwen, Aider + CLI admin.",
  },
  {
    icon: RefreshCcw,
    tone: "indigo" as const,
    title: "OAuth Multi-Account",
    description:
      "Claude Code, Codex, Gemini, Antigravity, Kimi, GitHub Copilot, GitLab Duo, Qoder, Trae dan banyak lagi.",
  },
  {
    icon: Webhook,
    tone: "amber" as const,
    title: "Webhooks & Live View",
    description:
      "Webhook events, notifikasi, dan live monitoring real-time via WebSocket langsung di dashboard.",
  },
  {
    icon: BarChart3,
    tone: "cyan" as const,
    title: "Usage Analytics",
    description:
      "Lacak token, biaya, dan budget per key atau per provider dengan laporan yang jelas dan terstruktur.",
  },
];

export const STRATEGIES = [
  { name: "Priority", desc: "Selalu mencoba provider sesuai urutan konfigurasi Anda." },
  { name: "Round-robin", desc: "Membagi beban secara merata ke semua provider yang aktif." },
  { name: "Auto-fallback", desc: "Coba provider utama; otomatis cascade ke cadangan saat gagal." },
  { name: "Health-based", desc: "Prioritaskan provider dengan skor kesehatan terbaik saat ini." },
  { name: "Model-based", desc: "Routing berdasarkan prefix ID model atau aturan kustom." },
  { name: "Custom rules", desc: "Routing sepenuhnya kustom melalui rules engine." },
];

/**
 * Provider unggulan — ikon brand ASLI (di-scrape dari simple-icons CDN +
 * favicon resmi masing-masing, disimpan lokal di public/providers/)
 * beserta deskripsi singkat bilingual untuk tooltip.
 */
export const PROVIDERS = [
  { name: "OpenAI", icon: "/providers/openai.svg", desc: { id: "GPT-4o, GPT-4.1 & o-series — model frontier OpenAI.", en: "GPT-4o, GPT-4.1 & o-series — OpenAI frontier models." } },
  { name: "Anthropic", icon: "/providers/anthropic.svg", desc: { id: "Claude — unggul di coding & long context.", en: "Claude — strong at coding & long context." } },
  { name: "Google Gemini", icon: "/providers/google.svg", desc: { id: "Gemini 2.5 Pro/Flash — multimodal, konteks 1M.", en: "Gemini 2.5 Pro/Flash — multimodal, 1M context." } },
  { name: "Ollama", icon: "/providers/ollama.svg", desc: { id: "Model lokal gratis — llama3, qwen, mistral.", en: "Free local models — llama3, qwen, mistral." } },
  { name: "Mistral", icon: "/providers/mistral.svg", desc: { id: "Mistral Large/Medium — model Eropa yang efisien.", en: "Mistral Large/Medium — efficient European models." } },
  { name: "Groq", icon: "/providers/groq.svg", desc: { id: "Inferensi super cepat via LPU — Llama & Mixtral.", en: "Ultra-fast LPU inference — Llama & Mixtral." } },
  { name: "DeepSeek", icon: "/providers/deepseek.svg", desc: { id: "DeepSeek-V3/R1 — reasoning murah & open-weight.", en: "DeepSeek-V3/R1 — cheap open-weight reasoning." } },
  { name: "Qwen", icon: "/providers/qwen.svg", desc: { id: "Qwen 2.5 — keluarga model Alibaba, open-weight.", en: "Qwen 2.5 — Alibaba's open-weight family." } },
  { name: "LM Studio", icon: "/providers/lmstudio.svg", desc: { id: "Jalankan model lokal GGUF dengan GUI.", en: "Run local GGUF models with a GUI." } },
  { name: "vLLM", icon: "/providers/vllm.svg", desc: { id: "Serving LLM throughput tinggi untuk self-host.", en: "High-throughput LLM serving for self-hosting." } },
  { name: "Cohere", icon: "/providers/cohere.png", desc: { id: "Command R+ — model enterprise & RAG.", en: "Command R+ — enterprise & RAG models." } },
  { name: "Perplexity", icon: "/providers/perplexity.svg", desc: { id: "Model online dengan pencarian real-time.", en: "Online models with real-time search." } },
  { name: "GitHub Copilot", icon: "/providers/github.svg", desc: { id: "OAuth — coding assistant terintegrasi VS Code.", en: "OAuth — coding assistant built into VS Code." } },
  { name: "GitLab Duo", icon: "/providers/gitlab.svg", desc: { id: "OAuth — AI pair-programming di GitLab.", en: "OAuth — AI pair programming in GitLab." } },
  { name: "Kimi", icon: "/providers/kimi.svg", desc: { id: "Kimi K2 — model Moonshot, kuat di coding.", en: "Kimi K2 — Moonshot's strong coding model." } },
  { name: "Trae", icon: "/providers/trae.svg", desc: { id: "IDE AI dari ByteDance — OAuth didukung.", en: "ByteDance's AI IDE — OAuth supported." } },
  { name: "Qoder", icon: "/providers/qoder.svg", desc: { id: "IDE AI cerdas dengan agen coding.", en: "Smart AI IDE with coding agents." } },
  { name: "Antigravity", icon: "/providers/antigravity.ico", desc: { id: "IDE agentic Google — coding bersama agen AI.", en: "Google's agentic IDE for AI coding." } },
  // ---- gelombang kedua: provider AI lain yang umum didukung gateway ----
  { name: "Meta Llama", icon: "/providers/meta.svg", desc: { id: "Llama 3/4 — model open-weight dari Meta.", en: "Llama 3/4 — Meta's open-weight models." } },
  { name: "xAI", icon: "/providers/xai.ico", desc: { id: "Grok — model xAI dengan data real-time.", en: "Grok — xAI's real-time reasoning models." } },
  { name: "Azure OpenAI", icon: "/providers/microsoft.ico", desc: { id: "GPT di ekosistem enterprise Azure.", en: "GPT within the Azure enterprise ecosystem." } },
  { name: "Amazon Bedrock", icon: "/providers/amazonwebservices.ico", desc: { id: "Akses model frontier langsung dari AWS.", en: "Access frontier models directly via AWS." } },
  { name: "NVIDIA NIM", icon: "/providers/nvidia.svg", desc: { id: "Inferensi model NVIDIA berperforma tinggi.", en: "High-performance NVIDIA model inference." } },
  { name: "Hugging Face", icon: "/providers/huggingface.svg", desc: { id: "Ratusan ribu model open-source, satu API.", en: "Hundreds of thousands of open-source models, one API." } },
  { name: "Replicate", icon: "/providers/replicate.svg", desc: { id: "Ribuan model komunitas di balik satu API.", en: "Thousands of community models behind one API." } },
  { name: "IBM watsonx", icon: "/providers/ibm.ico", desc: { id: "Platform AI enterprise dari IBM.", en: "IBM's enterprise AI platform." } },
  { name: "ElevenLabs", icon: "/providers/elevenlabs.svg", desc: { id: "Suara AI & TTS kualitas tinggi.", en: "High-quality AI voice & TTS." } },
  { name: "Cursor", icon: "/providers/cursor.svg", desc: { id: "Editor AI-native dengan model internal.", en: "AI-native code editor with built-in models." } },
  { name: "OpenRouter", icon: "/providers/openrouter.svg", desc: { id: "Satu API ke 300+ model dari banyak vendor.", en: "One API to 300+ models from many vendors." } },
  { name: "Together AI", icon: "/providers/together.png", desc: { id: "Cloud inference cepat untuk open models.", en: "Fast cloud inference for open models." } },
  { name: "Fireworks AI", icon: "/providers/fireworks.svg", desc: { id: "Inferensi open-source yang sangat cepat.", en: "Ultra-fast open-source model inference." } },
  { name: "Cerebras", icon: "/providers/cerebras.png", desc: { id: "Inferensi tercepat di dunia, wafer-scale.", en: "World's fastest inference on wafer-scale silicon." } },
  { name: "Zhipu GLM", icon: "/providers/zhipu.ico", desc: { id: "GLM-4 — model frontier dari Zhipu AI.", en: "GLM-4 — Zhipu AI's frontier models." } },
] as const;

export type Provider = (typeof PROVIDERS)[number];

/** Tools/klien yang terintegrasi satu-perintah — beserta deskripsi untuk tooltip. */
export const TOOLS = [
  { name: "Claude Code", desc: { id: "CLI agentic dari Anthropic, langsung di terminal.", en: "Anthropic's agentic CLI, right in your terminal." } },
  { name: "Cursor", desc: { id: "Editor AI-native dengan tab completion.", en: "AI-native editor with tab completion." } },
  { name: "Codex", desc: { id: "Agen coding OpenAI di CLI & IDE.", en: "OpenAI's coding agent for CLI & IDE." } },
  { name: "Cline", desc: { id: "Asisten coding open-source di VS Code.", en: "Open-source coding assistant in VS Code." } },
  { name: "Continue", desc: { id: "Ekstensi coding AI open-source untuk VS Code/JetBrains.", en: "Open-source AI coding extension for VS Code/JetBrains." } },
  { name: "Roo", desc: { id: "Agen coding mode-driven (turunan Cline).", en: "Mode-driven coding agent (a Cline fork)." } },
  { name: "Goose", desc: { id: "Agen AI lokal dari Block, jalan di perangkat Anda.", en: "Block's on-device AI agent." } },
  { name: "Qwen", desc: { id: "Model Qwen via CodeQwen / Qwen CLI.", en: "Qwen models via CodeQwen / Qwen CLI." } },
  { name: "Aider", desc: { id: "Pair-programming AI berbasis terminal.", en: "Terminal-based AI pair programming." } },
  { name: "OpenCode", desc: { id: "Agen coding open-source yang berjalan di terminal.", en: "Open-source coding agent that lives in your terminal." } },
] as const;

export const SECURITY_LAYERS = [
  { title: "Secret isolation", desc: "API key dienkripsi di SQLite (API_KEY_SECRET); opsi enkripsi DB penuh (STORAGE_ENCRYPTION_KEY)." },
  { title: "SSRF guard", desc: "Memblokir panggilan keluar ke jaringan privat / cloud metadata kecuali diizinkan eksplisit." },
  { title: "Prompt-injection guard", desc: "Memindai pesan masuk untuk pola injeksi dengan mode warn / block / threshold." },
  { title: "PII sanitizer", desc: "Meredaksi atau memblokir PII pada request dan respons LLM." },
  { title: "Credential masking", desc: "Menyembunyikan pola API key yang dikenal di payload dan log." },
  { title: "Rate limit & budgets", desc: "Gerbang per-key dan per-IP, pelacakan spend, monitoring kuota otomatis." },
  { title: "Proxy egress", desc: "HTTP/SOCKS5 egress dengan mode fail-closed + spoofing TLS fingerprint opsional." },
  { title: "Access control", desc: "REQUIRE_API_KEY, akses MCP scoped, sesi JWT, cookie aman, CORS allow-list." },
];

export const CLI_COMMANDS = [
  ["dikaroute", "Menjalankan dashboard (default :20128)"],
  ["dikaroute setup-claude", "Integrasi Claude Code satu-perintah"],
  ["dikaroute setup-codex", "Integrasi Codex satu-perintah"],
  ["dikaroute setup-cursor", "Integrasi Cursor satu-perintah"],
  ["dikaroute setup-cline", "Integrasi Cline satu-perintah"],
  ["dikaroute dashboard", "Buka web dashboard"],
  ["dikaroute status / health", "Cek kesehatan gateway & provider"],
  ["dikaroute providers / models", "Kelola provider & model"],
  ["dikaroute keys / usage / cost", "Kelola key, usage, dan spend"],
  ["dikaroute tunnel", "ngrok / Cloudflare / Tailscale tunnel"],
  ["dikaroute backup / doctor", "Backup & diagnostik"],
  ["dikaroute update", "Self-update ke versi terbaru"],
];

export const FAQ_ITEMS = [
  {
    q: "Apa itu DikaRoute sebenarnya?",
    a: "DikaRoute adalah AI gateway self-hosted: ia duduk di antara aplikasi Anda dan banyak provider LLM, memberi satu endpoint kompatibel OpenAI dengan routing, fallback, kompresi, monitoring, dan keamanan terintegrasi.",
  },
  {
    q: "Provider AI apa saja yang didukung?",
    a: "Semua API kompatibel OpenAI (OpenAI, Anthropic, Google Gemini, Ollama, LM Studio, vLLM, endpoint kustom…) plus provider berbasis OAuth seperti Claude Code, Codex, Gemini, Antigravity, Kimi, GitHub Copilot, GitLab Duo, Qoder, dan Trae. Total 290+ provider.",
  },
  {
    q: "Apakah DikaRoute menyimpan API key saya?",
    a: "Ya, di SQLite lokal, dienkripsi saat disimpan dengan API_KEY_SECRET. Aktifkan STORAGE_ENCRYPTION_KEY untuk enkripsi penuh database.",
  },
  {
    q: "Bisakah saya menggunakan model lokal?",
    a: "Bisa — arahkan DikaRoute ke Ollama, LM Studio, vLLM, atau Llamafile dan set DIKAROUTE_ALLOW_PRIVATE_PROVIDER_URLS=true.",
  },
  {
    q: "Di port berapa DikaRoute berjalan?",
    a: "Dashboard + API: 20128 (default). Mode split: API 20129, Dashboard 20128. Live WebSocket: 20132. Semua dapat diubah via environment variables.",
  },
  {
    q: "Bagaimana cara kerja automatic fallback?",
    a: "Ketika provider utama gagal (rate limit, outage, timeout, 5xx), request otomatis dicoba ulang ke provider sehat berikutnya sesuai urutan konfigurasi — transparan, tanpa perubahan aplikasi.",
  },
  {
    q: "Bisakah saya mengekspos DikaRoute ke internet?",
    a: "Ya. Set NEXT_PUBLIC_BASE_URL, gunakan AUTH_COOKIE_SECURE=true di belakang HTTPS, wajibkan API key jika publik, dan gunakan perintah tunnel bawaan (ngrok / Cloudflare / Tailscale) atau reverse proxy sendiri.",
  },
  {
    q: "Apakah DikaRoute gratis?",
    a: "Ya! DikaRoute adalah open source (MIT License) dan gratis digunakan. Jika bermanfaat, Anda bisa mendukung pengembangannya lewat donasi Saweria.",
  },
];
