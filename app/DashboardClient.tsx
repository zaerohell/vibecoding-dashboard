"use client";
import { useEffect, useState, useRef } from "react";

interface Task {
  id: string; name: string; status: string; priority: number;
  url: string; dueDate: number | null; tags: string[]; assignee: string | null;
}
interface Project {
  id: string; name: string; description: string; color: string; icon: string;
  url: string; repo: string; stack: string[]; version: string; build: string;
  commit: string; status: "production" | "wip"; tasks: Task[]; error?: string;
}

function useCounter(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = performance.now();
    const frame = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setCount(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [target, duration]);
  return count;
}

const DONE_STATES = ["completadas","completado","done","closed","complete"];
const isDoneStatus = (s: string) => DONE_STATES.includes(s.toLowerCase().trim());

// ── Glass card — the real Liquid Glass effect ──────────────────────────────
function GlassCard({ children, color, className = "", style = {} }: {
  children: React.ReactNode; color?: string;
  className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    ref.current?.style.setProperty("--mx", `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
    ref.current?.style.setProperty("--my", `${((e.clientY - r.top)  / r.height * 100).toFixed(1)}%`);
  }

  return (
    <div ref={ref} onMouseMove={onMouseMove}
      className={`group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${className}`}
      style={{
        // The actual glass — needs rich background behind it to work
        background: "linear-gradient(135deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.08) 100%)",
        backdropFilter: "blur(40px) saturate(180%) brightness(1.1)",
        WebkitBackdropFilter: "blur(40px) saturate(180%) brightness(1.1)",
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.15)",
        ...style,
      }}>

      {/* Specular highlight — top edge like real glass */}
      <div className="absolute top-0 left-4 right-4 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)" }} />

      {/* Inner top glow — light refraction */}
      <div className="absolute top-0 left-0 right-0 h-20 rounded-t-3xl pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)" }} />

      {/* Mouse-tracking color glow */}
      {color && (
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl"
          style={{
            background: `radial-gradient(400px circle at var(--mx,50%) var(--my,50%), ${color}25, transparent 60%)`,
          }} />
      )}

      {/* Bottom edge shadow */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "rgba(0,0,0,0.3)" }} />

      {children}
    </div>
  );
}

// ── KPI pill ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, accent, icon }: { label: string; value: number; accent?: string; icon: string }) {
  const count = useCounter(value);
  return (
    <GlassCard>
      <div className="px-6 py-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-2xl">{icon}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: accent ? `${accent}20` : "rgba(255,255,255,0.1)",
              color: accent ?? "rgba(255,255,255,0.6)",
              border: `1px solid ${accent ? accent + "30" : "rgba(255,255,255,0.15)"}`,
            }}>
            LIVE
          </span>
        </div>
        <p className="text-4xl font-bold tracking-tight mb-1"
          style={{ color: accent ?? "#fff", fontFamily: "'SF Pro Display', system-ui, sans-serif" }}>
          {count}
        </p>
        <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
      </div>
    </GlassCard>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "production" | "wip" }) {
  const cfg = status === "production"
    ? { label: "Live", color: "#30d158", bg: "rgba(48,209,88,0.15)", border: "rgba(48,209,88,0.3)" }
    : { label: "WIP",  color: "#ffd60a", bg: "rgba(255,214,10,0.15)", border: "rgba(255,214,10,0.3)" };
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
      <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
    </div>
  );
}

// ── Task row ───────────────────────────────────────────────────────────────
function TaskRow({ task }: { task: Task }) {
  const done = isDoneStatus(task.status);
  const priorityColor = ["","#ff453a","#ff9f0a","#0a84ff","rgba(255,255,255,0.3)"][task.priority] ?? "rgba(255,255,255,0.3)";
  return (
    <a href={task.url} target="_blank" rel="noopener"
      className="flex items-start gap-3 px-4 py-3 rounded-2xl transition-all duration-200 hover:bg-white/10 group/task">
      <div className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
        style={{ background: done ? "rgba(48,209,88,0.6)" : priorityColor }} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${done ? "line-through opacity-40" : "text-white"}`}>
          {task.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-medium capitalize"
            style={{ color: done ? "rgba(48,209,88,0.7)" : "rgba(255,255,255,0.4)" }}>
            {task.status}
          </span>
          {task.dueDate && !done && (
            <span className="text-xs" style={{ color: task.dueDate < Date.now() ? "#ff453a" : "rgba(255,255,255,0.3)" }}>
              · {new Date(task.dueDate).toLocaleDateString("es-MX", { day:"2-digit", month:"short" })}
            </span>
          )}
        </div>
      </div>
      <span className="text-white/20 group-hover/task:text-white/50 transition-colors text-sm">↗</span>
    </a>
  );
}

// ── Project card ───────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const done   = project.tasks.filter(t => isDoneStatus(t.status));
  const active = project.tasks.filter(t => !isDoneStatus(t.status));
  const inProg = active.filter(t => t.status.toLowerCase().includes("progreso") || t.status.toLowerCase().includes("curso"));
  const open   = active.filter(t => !t.status.toLowerCase().includes("progreso") && !t.status.toLowerCase().includes("bloqueada"));
  const pct    = project.tasks.length > 0 ? Math.round(done.length / project.tasks.length * 100) : 0;

  return (
    <GlassCard color={project.color}>
      {/* Color accent top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
        style={{ background: `linear-gradient(90deg, ${project.color}, ${project.color}88)` }} />

      <div className="p-6 pt-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${project.color}30, ${project.color}10)`,
                border: `1px solid ${project.color}40`,
                boxShadow: `0 4px 12px ${project.color}20`,
              }}>
              {project.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight"
                style={{ fontFamily: "'SF Pro Display', system-ui, sans-serif" }}>
                {project.name}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{project.description}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <StatusBadge status={project.status} />
            <a href={project.url} target="_blank"
              className="text-sm font-medium px-3 py-1 rounded-xl transition-all hover:bg-white/15"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.7)",
              }}>
              App ↗
            </a>
          </div>
        </div>

        {/* Stack */}
        <div className="flex gap-2 flex-wrap mb-5">
          {project.stack.map(s => (
            <span key={s} className="text-xs font-medium px-2.5 py-1 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.6)",
              }}>
              {s}
            </span>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Progreso</span>
            <span className="text-sm font-bold" style={{ color: project.color }}>{pct}%</span>
          </div>
          {/* Glass progress bar */}
          <div className="relative h-2 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${project.color}aa, ${project.color})`,
                boxShadow: `0 0 12px ${project.color}80`,
              }} />
            {/* Specular on bar */}
            <div className="absolute inset-0 rounded-full"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 60%)" }} />
          </div>
          <div className="flex gap-4 mt-2">
            {inProg.length > 0 && (
              <span className="text-xs font-medium" style={{ color: "#0a84ff" }}>▶ {inProg.length} en progreso</span>
            )}
            {open.length > 0 && (
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>○ {open.length} pendientes</span>
            )}
            {done.length > 0 && (
              <span className="text-xs font-medium" style={{ color: "#30d158" }}>✓ {done.length} completadas</span>
            )}
          </div>
        </div>

        {/* Version / build — glass pill */}
        <div className="flex gap-2 items-center mb-5">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg"
            style={{
              background: `${project.color}18`,
              border: `1px solid ${project.color}35`,
              color: project.color,
              boxShadow: `0 2px 8px ${project.color}15`,
            }}>
            {project.version}
          </span>
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.35)",
            }}>
            #{project.commit}
          </span>
          <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
            build {project.build}
          </span>
        </div>
      </div>

      {/* Tasks section */}
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden"
        style={{
          background: "rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(8px)",
        }}>
        {active.length === 0 && done.length > 0 && (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <span className="text-2xl">🎉</span>
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Al corriente · {done.length} completadas
            </p>
          </div>
        )}
        {active.length === 0 && done.length === 0 && (
          <div className="flex items-center justify-center py-6">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.2)" }}>Sin tareas activas</p>
          </div>
        )}
        {active.slice(0, 4).map(t => <TaskRow key={t.id} task={t} />)}
        {active.length > 4 && (
          <p className="text-xs font-medium text-center py-2" style={{ color: "rgba(255,255,255,0.25)" }}>
            +{active.length - 4} más en ClickUp
          </p>
        )}
      </div>
    </GlassCard>
  );
}

// ── Background — rich color layers for glass to blur ──────────────────────
function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden" style={{ background: "#050510" }}>
      {/* Main deep gradient */}
      <div className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 80% at 20% 20%, #1a0533 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 80%, #001a2e 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 50% 50%, #0d0d1a 0%, #050510 100%)",
        }} />
      {/* Colored orbs */}
      <div className="absolute w-[700px] h-[700px] -top-40 -left-40 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(120,40,200,0.35) 0%, transparent 70%)", filter: "blur(60px)" }} />
      <div className="absolute w-[600px] h-[600px] -bottom-40 -right-40 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(0,100,255,0.25) 0%, transparent 70%)", filter: "blur(60px)" }} />
      <div className="absolute w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(0,180,180,0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="absolute w-[300px] h-[300px] top-1/4 right-1/4 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(229,105,15,0.2) 0%, transparent 70%)", filter: "blur(50px)" }} />
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />
    </div>
  );
}

// ── Glass nav header ───────────────────────────────────────────────────────
function Header({ lastUpdate, countdown }: { lastUpdate: string | null; countdown: number }) {
  return (
    <header className="sticky top-0 z-50"
      style={{
        background: "rgba(5,5,16,0.5)",
        backdropFilter: "blur(48px) saturate(200%)",
        WebkitBackdropFilter: "blur(48px) saturate(200%)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.4)",
      }}>
      {/* Top specular line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }} />

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{
              background: "linear-gradient(135deg, rgba(229,105,15,0.3), rgba(229,105,15,0.1))",
              border: "1px solid rgba(229,105,15,0.3)",
            }}>
            🚀
          </div>
          <div>
            <div className="text-sm font-bold text-white" style={{ fontFamily: "'SF Pro Display', system-ui, sans-serif" }}>
              VibeCoding
            </div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Build in Public · zaerohell</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastUpdate && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                Sync {lastUpdate}
              </span>
            </div>
          )}

          {/* Countdown ring */}
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
              <circle cx="16" cy="16" r="13" fill="none" stroke="#E5690F" strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 13}`}
                strokeDashoffset={`${2 * Math.PI * 13 * (countdown / 60)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
              style={{ color: "rgba(255,255,255,0.4)" }}>
              {countdown}
            </span>
          </div>

          <a href="https://app.clickup.com" target="_blank"
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all hover:bg-white/15"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(8px)",
            }}>
            ClickUp ↗
          </a>
        </div>
      </div>
    </header>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function DashboardClient({ projects }: { projects: Project[] }) {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [countdown, setCountdown]   = useState(60);

  const total   = projects.reduce((s, p) => s + p.tasks.length, 0);
  const inProg  = projects.reduce((s, p) => s + p.tasks.filter(t =>
    t.status.toLowerCase().includes("progreso") || t.status.toLowerCase().includes("curso")).length, 0);
  const done    = projects.reduce((s, p) => s + p.tasks.filter(t => isDoneStatus(t.status)).length, 0);
  const pending = total - inProg - done;

  useEffect(() => {
    setLastUpdate(new Date().toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit", second:"2-digit" }));
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { window.location.reload(); return 60; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen relative" style={{ fontFamily: "'SF Pro Text', system-ui, -apple-system, sans-serif" }}>
      <Background />

      <Header lastUpdate={lastUpdate} countdown={countdown} />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-14">

        {/* Hero */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E5690F] animate-pulse" />
            <span className="text-sm font-medium tracking-wide"
              style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'SF Pro Mono', monospace" }}>
              zaerohell · {projects.length} proyectos activos
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white leading-none mb-4"
            style={{ fontFamily: "'SF Pro Display', system-ui, sans-serif" }}>
            Build in{" "}
            <span style={{
              background: "linear-gradient(135deg, #E5690F, #ff9f0a)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Public
            </span>
          </h1>
          <p className="text-lg" style={{ color: "rgba(255,255,255,0.4)" }}>
            Dashboard de desarrollo · Playa del Carmen, México
          </p>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          <KpiCard label="Total tareas"   value={total}   icon="📋" />
          <KpiCard label="En progreso"    value={inProg}  icon="⚡" accent="#0a84ff" />
          <KpiCard label="Pendientes"     value={pending} icon="⏳" accent="#ff9f0a" />
          <KpiCard label="Completadas"    value={done}    icon="✅" accent="#30d158" />
        </div>

        {/* Section label */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
          <span className="text-sm font-semibold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'SF Pro Mono', monospace" }}>
            Proyectos
          </span>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {projects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>

        {/* Footer */}
        <div className="mt-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>
              Live · ClickUp API v2 · Auto-refresh 60s
            </span>
          </div>
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.15)" }}>
            Cycle 4 · Jul 7–20
          </span>
        </div>
      </main>
    </div>
  );
}
