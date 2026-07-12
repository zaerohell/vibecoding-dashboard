"use client";

import { useEffect, useState, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface Task {
  id: string;
  name: string;
  status: string;
  priority: number;
  url: string;
  dueDate: number | null;
  tags: string[];
  assignee: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  url: string;
  repo: string;
  stack: string[];
  version: string;
  build: string;
  commit: string;
  status: "production" | "wip";
  tasks: Task[];
  error?: string;
}

// ── Hooks ──────────────────────────────────────────────────────────────────
function useCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    const frame = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [target, duration]);
  return count;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function GlowOrb({ color }: { color: string }) {
  return (
    <div
      className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
      style={{
        background: `radial-gradient(600px circle at var(--mx,50%) var(--my,50%), ${color}18, transparent 40%)`,
      }}
    />
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    production: "#4A9E5C",
    wip:        "#D4A843",
    error:      "#E5690F",
  };
  const c = colors[status] ?? "#666";
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: c }} />
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: c }} />
    </span>
  );
}

function TagPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wide border"
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.08)",
        color: "#999",
      }}>
      {label}
    </span>
  );
}

const PRIORITY_ICONS: Record<number, string> = { 1:"●", 2:"◕", 3:"◑", 4:"○" };
const PRIORITY_COLORS: Record<number, string> = { 1:"#E5690F", 2:"#D4A843", 3:"#5B9BF6", 4:"#444" };

function TaskRow({ task }: { task: Task }) {
  const isDone = ["completadas","completado","done","closed"].includes(task.status.toLowerCase());
  return (
    <a href={task.url} target="_blank" rel="noopener"
      className="group/task flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 hover:bg-white/5">
      <span className="mt-0.5 text-[10px] flex-shrink-0" style={{ color: PRIORITY_COLORS[task.priority] ?? "#444" }}>
        {PRIORITY_ICONS[task.priority] ?? "○"}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-snug truncate ${isDone ? "line-through opacity-40" : "text-[#E8E8E8]"}`}>
          {task.name}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[9px] font-mono uppercase tracking-widest"
            style={{ color: isDone ? "#4A9E5C" : task.status.toLowerCase().includes("progreso") ? "#5B9BF6" : "#666" }}>
            {task.status}
          </span>
          {task.dueDate && !isDone && (
            <span className={`text-[9px] font-mono ${task.dueDate < Date.now() ? "text-[#E5690F]" : "text-[#666]"}`}>
              {new Date(task.dueDate).toLocaleDateString("es-MX", { day:"2-digit", month:"short" })}
            </span>
          )}
        </div>
      </div>
      <span className="text-[#333] group-hover/task:text-[#666] text-xs transition-colors flex-shrink-0">↗</span>
    </a>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const done  = project.tasks.filter(t => ["completadas","completado","done","closed"].includes(t.status.toLowerCase()));
  const active = project.tasks.filter(t => !["completadas","completado","done","closed"].includes(t.status.toLowerCase()));
  const pct   = project.tasks.length > 0 ? Math.round(done.length / project.tasks.length * 100) : 0;
  const open  = active.filter(t => !t.status.toLowerCase().includes("progreso") && !t.status.toLowerCase().includes("bloqueada"));
  const inProg = active.filter(t => t.status.toLowerCase().includes("progreso") || t.status.toLowerCase().includes("curso"));

  // Mouse glow tracking
  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + "%";
    const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + "%";
    cardRef.current?.style.setProperty("--mx", x);
    cardRef.current?.style.setProperty("--my", y);
  }

  return (
    <div ref={cardRef} onMouseMove={onMouseMove}
      className="group relative rounded-2xl overflow-hidden transition-transform duration-300 hover:-translate-y-0.5"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}>
      <GlowOrb color={project.color} />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${project.color}60, transparent)` }} />

      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{
                background: `${project.color}15`,
                border: `1px solid ${project.color}30`,
              }}>
              {project.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-mono font-bold text-[#E8E8E8] tracking-tight">{project.name}</h2>
                <StatusDot status={project.status} />
              </div>
              <p className="text-[11px] text-[#666] mt-0.5 leading-none">{project.description}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <a href={project.url} target="_blank"
              className="text-[10px] font-mono px-2 py-1 rounded-md transition-all hover:text-[#E8E8E8]"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#666",
              }}>
              ↗ APP
            </a>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: `${project.color}18`, color: project.color }}>
              {project.version}
            </span>
          </div>
        </div>

        {/* Stack pills */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {project.stack.map(s => <TagPill key={s} label={s} />)}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] font-mono text-[#444] uppercase tracking-widest">progress</span>
            <span className="text-[10px] font-mono" style={{ color: project.color }}>{pct}%</span>
          </div>
          <div className="h-0.5 w-full rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${project.color}80, ${project.color})` }} />
          </div>
          <div className="flex gap-3 mt-2">
            {inProg.length > 0 && <span className="text-[9px] font-mono text-[#5B9BF6]">▶ {inProg.length} activas</span>}
            {open.length  > 0 && <span className="text-[9px] font-mono text-[#555]">○ {open.length} pendientes</span>}
            {done.length  > 0 && <span className="text-[9px] font-mono text-[#4A9E5C]">✓ {done.length} completadas</span>}
          </div>
        </div>

        {/* Commit/build info */}
        <div className="mt-3 pt-3 flex gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-[9px] font-mono text-[#444]">commit <span className="text-[#555]">#{project.commit}</span></span>
          <span className="text-[9px] font-mono text-[#444]">build <span className="text-[#555]">{project.build}</span></span>
        </div>
      </div>

      {/* Tasks */}
      <div className="px-2 pb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        {active.length === 0 && done.length > 0 && (
          <div className="flex flex-col items-center justify-center py-5 gap-1">
            <span className="text-lg">🎉</span>
            <p className="text-[10px] font-mono text-[#444]">AL CORRIENTE · {done.length} done</p>
          </div>
        )}
        {active.length === 0 && done.length === 0 && (
          <div className="flex items-center justify-center py-5">
            <p className="text-[10px] font-mono text-[#333]">— SIN TAREAS —</p>
          </div>
        )}
        {active.slice(0, 5).map(t => <TaskRow key={t.id} task={t} />)}
        {active.length > 5 && (
          <p className="text-[9px] font-mono text-[#333] text-center pt-1">
            +{active.length - 5} más en ClickUp
          </p>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  const count = useCounter(value);
  return (
    <div className="rounded-xl px-5 py-4 flex flex-col gap-1"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
      }}>
      <p className="text-3xl font-mono font-black" style={{ color: accent ?? "#E8E8E8" }}>{count}</p>
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#444]">{label}</p>
    </div>
  );
}

// ── Scanline animation ─────────────────────────────────────────────────────
function ScanlineHeader() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
        }} />
    </div>
  );
}

// ── Noise overlay ──────────────────────────────────────────────────────────
function NoiseLayer() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "256px 256px",
      }} />
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function DashboardClient({ projects }: { projects: Project[] }) {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  const total     = projects.reduce((s, p) => s + p.tasks.length, 0);
  const inProg    = projects.reduce((s, p) => s + p.tasks.filter(t => t.status.toLowerCase().includes("progreso") || t.status.toLowerCase().includes("curso")).length, 0);
  const done      = projects.reduce((s, p) => s + p.tasks.filter(t => ["completadas","completado","done","closed"].includes(t.status.toLowerCase())).length, 0);
  const pending   = projects.reduce((s, p) => s + p.tasks.filter(t => !["completadas","completado","done","closed"].includes(t.status.toLowerCase()) && !t.status.toLowerCase().includes("progreso")).length, 0);

  useEffect(() => {
    setLastUpdate(new Date().toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit", second:"2-digit" }));
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { window.location.reload(); return 60; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative" style={{ background: "#000", color: "#E8E8E8", fontFamily: "'Space Mono', 'JetBrains Mono', monospace" }}>
      <NoiseLayer />

      {/* Ambient gradient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-64 -left-64 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #E5690F, transparent 70%)" }} />
        <div className="absolute -bottom-64 -right-64 w-[800px] h-[800px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #5B9BF6, transparent 70%)" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50"
        style={{
          background: "rgba(0,0,0,0.72)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
        }}>
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#E5690F] tracking-[0.2em] uppercase">VibeCoding</span>
              <span className="text-[#333] text-xs">·</span>
              <span className="text-[10px] font-mono text-[#444] tracking-widest">Build in Public / {new Date().getFullYear()}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <span className="text-[9px] font-mono text-[#444] hidden sm:block">
                SYNC {lastUpdate}
              </span>
            )}
            {/* Countdown ring */}
            <div className="relative w-7 h-7">
              <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="11" fill="none" stroke="#1A1A1A" strokeWidth="2" />
                <circle cx="14" cy="14" r="11" fill="none" stroke="#E5690F" strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 11}`}
                  strokeDashoffset={`${2 * Math.PI * 11 * (countdown / 60)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-[#555]">{countdown}</span>
            </div>
            <a href="https://app.clickup.com" target="_blank"
              className="text-[10px] font-mono px-3 py-1.5 rounded-lg transition-colors hover:text-[#E8E8E8]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#666",
              }}>
              CLICKUP ↗
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-5 py-12">
        {/* Hero */}
        <div className="mb-16">
          <p className="text-[10px] font-mono text-[#E5690F] tracking-[0.3em] uppercase mb-4">zaerohell · {projects.length} proyectos activos</p>
          <h1 className="text-4xl sm:text-5xl font-mono font-black tracking-tight leading-none mb-2" style={{ color: "#E8E8E8" }}>
            Build in Public
          </h1>
          <p className="text-[#444] font-mono text-sm mt-2">
            Dashboard de desarrollo · Playa del Carmen, México
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          <KpiCard label="Total tareas"  value={total}   />
          <KpiCard label="En progreso"   value={inProg}  accent="#5B9BF6" />
          <KpiCard label="Pendientes"    value={pending} accent="#D4A843" />
          <KpiCard label="Completadas"   value={done}    accent="#4A9E5C" />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span className="text-[9px] font-mono text-[#333] tracking-[0.3em] uppercase">Proyectos</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>

        {/* Footer */}
        <div className="mt-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-[#4A9E5C] animate-pulse" />
            <span className="text-[9px] font-mono text-[#333] uppercase tracking-widest">Live · ClickUp API v2</span>
          </div>
          <span className="text-[9px] font-mono text-[#2A2A2A]">Cycle 4 · Jul 7–20</span>
        </div>
      </main>
    </div>
  );
}
