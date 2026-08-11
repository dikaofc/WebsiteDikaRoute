import type { LucideIcon } from "lucide-react";
import { Zap, Building2, Plug, Settings, ShieldCheck, Bot, Container, Smartphone } from "lucide-react";
import type { Lang } from "../../i18n";
import quickstart from "./quickstart.md?raw";
import architecture from "./architecture.md?raw";
import termux from "./termux.md?raw";
import api from "./api.md?raw";
import config from "./config.md?raw";
import security from "./security.md?raw";
import cli from "./cli.md?raw";
import docker from "./docker.md?raw";
import quickstartEn from "./en/quickstart.md?raw";
import architectureEn from "./en/architecture.md?raw";
import termuxEn from "./en/termux.md?raw";
import apiEn from "./en/api.md?raw";
import configEn from "./en/config.md?raw";
import securityEn from "./en/security.md?raw";
import cliEn from "./en/cli.md?raw";
import dockerEn from "./en/docker.md?raw";

export interface DocEntry {
  slug: string;
  group: string;
  title: string;
  description: string;
  icon: LucideIcon;
  md: string;
}

const ICONS = {
  quickstart: Zap,
  architecture: Building2,
  api: Plug,
  config: Settings,
  security: ShieldCheck,
  cli: Bot,
  docker: Container,
  termux: Smartphone,
} as const;

type Slug = "quickstart" | "architecture" | "termux" | "api" | "config" | "security" | "cli" | "docker";
type DocMeta = Omit<DocEntry, "icon" | "md"> & { slug: Slug };

const META_ID: DocMeta[] = [
  { slug: "quickstart", group: "Mulai", title: "Panduan Cepat", description: "Dari nol hingga request AI pertama dalam beberapa menit." },
  { slug: "architecture", group: "Mulai", title: "Arsitektur", description: "Memahami cara kerja DikaRoute di balik layar." },
  { slug: "api", group: "Referensi", title: "API Reference", description: "Endpoint OpenAI-compatible di /v1." },
  { slug: "config", group: "Referensi", title: "Konfigurasi", description: "Provider, strategi routing, dan environment variables." },
  { slug: "security", group: "Referensi", title: "Keamanan", description: "Lapisan keamanan berlapis DikaRoute." },
  { slug: "cli", group: "Referensi", title: "CLI & Ekosistem", description: "Perintah CLI untuk setup dan operasi." },
  { slug: "docker", group: "Deploy", title: "Docker Deployment", description: "Menjalankan DikaRoute dengan Docker." },
  { slug: "termux", group: "Deploy", title: "Panduan Termux", description: "Menjalankan DikaRoute di Android / Termux." },
];

const META_EN: DocMeta[] = [
  { slug: "quickstart", group: "Getting Started", title: "Quickstart", description: "From zero to your first AI request in minutes." },
  { slug: "architecture", group: "Getting Started", title: "Architecture", description: "Understand how DikaRoute works under the hood." },
  { slug: "api", group: "Reference", title: "API Reference", description: "OpenAI-compatible endpoints at /v1." },
  { slug: "config", group: "Reference", title: "Configuration", description: "Providers, routing strategies, and environment variables." },
  { slug: "security", group: "Reference", title: "Security", description: "DikaRoute's layered security." },
  { slug: "cli", group: "Reference", title: "CLI & Ecosystem", description: "CLI commands for setup and operations." },
  { slug: "docker", group: "Deploy", title: "Docker Deployment", description: "Run DikaRoute with Docker." },
  { slug: "termux", group: "Deploy", title: "Termux Guide", description: "Run DikaRoute on Android / Termux." },
];

const MD = {
  id: { quickstart, architecture, termux, api, config, security, cli, docker },
  en: { quickstart: quickstartEn, architecture: architectureEn, termux: termuxEn, api: apiEn, config: configEn, security: securityEn, cli: cliEn, docker: dockerEn },
} as const;

function build(meta: DocMeta[]): DocEntry[] {
  return meta.map((m) => ({ ...m, icon: ICONS[m.slug], md: MD.id[m.slug] }));
}

function buildEn(meta: DocMeta[]): DocEntry[] {
  return meta.map((m) => ({ ...m, icon: ICONS[m.slug], md: MD.en[m.slug] }));
}

export function getDocs(lang: Lang): DocEntry[] {
  return lang === "en" ? buildEn(META_EN) : build(META_ID);
}

export function getDoc(slug: string, lang: Lang): DocEntry | undefined {
  return getDocs(lang).find((d) => d.slug === slug);
}

export function getDocGroups(lang: Lang): string[] {
  return [...new Set(getDocs(lang).map((d) => d.group))];
}
