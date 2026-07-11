// lib/projects.ts
export const PROJECTS = [
  {
    id:          "playamx",
    name:        "PlayaMXCRM",
    description: "CRM inmobiliario Riviera Maya",
    listId:      "901416845643",
    color:       "#0071e3",
    icon:        "🏠",
    url:         "https://playamxcrm.vercel.app",
    repo:        "zaerohell/VS",
    stack:       ["Next.js 16", "NestJS", "Neon", "Groq AI"],
    version:     "v1.6.1",
    build:       "20260629b",
    commit:      "8cff190",
    status:      "production" as const,
  },
  {
    id:          "lavanderia",
    name:        "Lavandería CRM",
    description: "CRM operaciones lavandería",
    listId:      "901416845673",
    color:       "#4f46e5",
    icon:        "👕",
    url:         "https://lavanderia-crm.vercel.app",
    repo:        "zaerohell/lavanderia-crm",
    stack:       ["Next.js 14", "Neon", "Jose Auth"],
    version:     "v1.0.0",
    build:       "20260702",
    commit:      "b0d23df",
    status:      "production" as const,
  },
  {
    id:          "riviera",
    name:        "Riviera Industrial ERP",
    description: "ERP manufactura y servicios",
    listId:      "901416845649",
    color:       "#f97316",
    icon:        "🔧",
    url:         "https://riviera-erp.vercel.app",
    repo:        "zaerohell/riviera-industrial-erp",
    stack:       ["Next.js 14", "Prisma", "Neon", "NextAuth"],
    version:     "v1.0.0",
    build:       "20260703",
    commit:      "d26707d",
    status:      "production" as const,
  },
  {
    id:          "bienestar",
    name:        "Bienestar Integral KB",
    description: "Knowledge base wellness",
    listId:      "901416845658",
    color:       "#10b981",
    icon:        "🌿",
    url:         "https://bienestar-integral-kb.vercel.app",
    repo:        "zaerohell/bienestar-integral-kb",
    stack:       ["Next.js 15", "Prisma", "Neon", "Groq"],
    version:     "v1.1.0",
    build:       "20260703",
    commit:      "a176de4",
    status:      "production" as const,
  },
  {
    id:          "greenview",
    name:        "GreenView",
    description: "Infrastructure Visibility Dashboard",
    listId:      "901417923251",
    color:       "#22c55e",
    icon:        "📊",
    url:         "https://greenview-five.vercel.app",
    repo:        "zaerohell/greenview",
    stack:       ["Next.js 15", "Prisma 7", "Neon", "Google Sheets"],
    version:     "v0.1.0",
    build:       "20260710",
    commit:      "8f2f199",
    status:      "wip" as const,
  },
  {
    id:          "tvview",
    name:        "TVView",
    description: "IPTV / Chromecast Inventory Dashboard",
    listId:      "901417986124",
    color:       "#3b82f6",
    icon:        "📺",
    url:         "https://tvview.vercel.app",
    repo:        "zaerohell/tvview",
    stack:       ["Next.js 15", "Prisma 7", "Neon", "Google Sheets API"],
    version:     "v0.1.0",
    build:       "20260710",
    commit:      "3b48647",
    status:      "wip" as const,
  },
  {
    id:          "craveview",
    name:        "CraveView",
    description: "Crave T3 Tablet Inventory Dashboard",
    listId:      "901417986126",
    color:       "#f59e0b",
    icon:        "🍽️",
    url:         "https://craveview.vercel.app",
    repo:        "zaerohell/craveview",
    stack:       ["Next.js 15", "Prisma 7", "Neon", "Google Sheets"],
    version:     "v0.1.0",
    build:       "20260710",
    commit:      "5d0a53c",
    status:      "wip" as const,
  },
] as const;

export type Project = typeof PROJECTS[number];

export function normalizeStatus(raw: string): "open" | "in_progress" | "done" | "blocked" {
  const s = raw.toLowerCase().trim();
  if (["completadas","completado","done","closed","complete","completed","cerrada","cerrado"].includes(s)) return "done";
  if (["en progreso","in progress","in_progress","working","active","en curso"].includes(s)) return "in_progress";
  if (["bloqueada","bloqueado","blocked","on hold","waiting"].includes(s)) return "blocked";
  return "open";
}

export const STATUS_CONFIG = {
  open:        { label: "Pendiente",   cls: "bg-slate-100 text-slate-600 border-slate-200"      },
  in_progress: { label: "En progreso", cls: "bg-amber-50 text-amber-700 border-amber-200"       },
  done:        { label: "Completada",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  blocked:     { label: "Bloqueada",   cls: "bg-rose-50 text-rose-700 border-rose-200"          },
} as const;

export const PRIORITY_ICON: Record<number, string> = { 1:"🔴", 2:"🟡", 3:"🔵", 4:"⚪" };
