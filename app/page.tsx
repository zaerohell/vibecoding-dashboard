import { PROJECTS, STATUS_CONFIG, PRIORITY_ICON } from "@/lib/projects";
import { fetchAllProjects, type CUTask } from "@/lib/clickup";
import { RefreshBar } from "./RefreshBar";

export const dynamic = "force-dynamic";
export const revalidate = 60;

function TaskRow({ task }: { task: CUTask }) {
  const cfg = STATUS_CONFIG[task.status];
  return (
    <a href={task.url} target="_blank" rel="noopener"
      className="flex items-start gap-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2.5 hover:bg-slate-700/60 transition-colors group">
      <span className="text-xs mt-0.5 flex-shrink-0">{PRIORITY_ICON[task.priority] ?? "⚪"}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${task.status === "done" ? "line-through text-slate-500" : "text-slate-200"}`}>
          {task.name}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${cfg.cls}`}>
            {cfg.label}
          </span>
          {task.assignee && (
            <span className="text-[9px] text-slate-500">@{task.assignee}</span>
          )}
          {task.dueDate && task.status !== "done" && (
            <span className={`text-[9px] font-medium ${task.dueDate < Date.now() ? "text-rose-400" : "text-slate-500"}`}>
              📅 {new Date(task.dueDate).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
            </span>
          )}
          {task.tags.map(tag => (
            <span key={tag} className="text-[9px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <span className="text-slate-600 group-hover:text-slate-400 text-xs flex-shrink-0 transition-colors">↗</span>
    </a>
  );
}

function StatPill({ label, count, cls }: { label: string; count: number; cls: string }) {
  if (count === 0) return null;
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <span className="text-base leading-none">{count}</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
}

export default async function HomePage() {
  const allData = await fetchAllProjects(PROJECTS.map(p => p.listId));

  // Merge por proyecto
  const projects = PROJECTS.map((p, i) => ({ ...p, ...allData[i] }));

  // Totales globales
  const totalTasks      = projects.reduce((s, p) => s + p.tasks.length, 0);
  const totalInProgress = projects.reduce((s, p) => s + p.tasks.filter(t => t.status === "in_progress").length, 0);
  const totalBlocked    = projects.reduce((s, p) => s + p.tasks.filter(t => t.status === "blocked").length, 0);
  const totalDone       = projects.reduce((s, p) => s + p.tasks.filter(t => t.status === "done").length, 0);
  const totalOpen       = projects.reduce((s, p) => s + p.tasks.filter(t => t.status === "open").length, 0);
  const hasApiKey       = !!process.env.CLICKUP_API_KEY;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">VibeCoding</h1>
              <p className="text-xs text-slate-400 leading-none">Build in Public · zaerohell</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatPill label="en progreso" count={totalInProgress} cls="bg-amber-900/50 text-amber-300 border border-amber-700/50" />
            <StatPill label="bloqueadas"  count={totalBlocked}    cls="bg-rose-900/50 text-rose-300 border border-rose-700/50"   />
            <a href="https://app.clickup.com" target="_blank"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors ml-2 hidden sm:block">
              ClickUp →
            </a>
            <RefreshBar />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Sin API key */}
        {!hasApiKey && (
          <div className="mb-6 rounded-xl border border-amber-700/50 bg-amber-900/20 px-5 py-4">
            <p className="text-sm font-semibold text-amber-300">⚠ CLICKUP_API_KEY no configurada</p>
            <p className="text-xs text-amber-400/80 mt-1">
              Agrega la variable en Vercel → Settings → Environment Variables → <code className="bg-amber-900/40 px-1 rounded">CLICKUP_API_KEY</code>
            </p>
          </div>
        )}

        {/* KPIs globales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total tareas",   count: totalTasks,       cls: "text-slate-200" },
            { label: "En progreso",    count: totalInProgress,  cls: "text-amber-400" },
            { label: "Pendientes",     count: totalOpen,        cls: "text-blue-400"  },
            { label: "Completadas",    count: totalDone,        cls: "text-emerald-400" },
          ].map(k => (
            <div key={k.label}
              className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-center">
              <p className={`text-3xl font-black ${k.cls}`}>{k.count}</p>
              <p className="text-xs text-slate-500 mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Grid de proyectos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {projects.map(p => {
            const inProgress = p.tasks.filter(t => t.status === "in_progress");
            const blocked    = p.tasks.filter(t => t.status === "blocked");
            const open       = p.tasks.filter(t => t.status === "open");
            const done       = p.tasks.filter(t => t.status === "done");
            const active     = [...inProgress, ...blocked, ...open];
            const donePct    = p.tasks.length > 0 ? Math.round(done.length / p.tasks.length * 100) : 0;

            return (
              <div key={p.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                {/* Header del proyecto */}
                <div className="px-5 py-4 border-b border-slate-800"
                  style={{ borderLeftColor: p.color, borderLeftWidth: 4 }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.icon}</span>
                      <div>
                        <h2 className="text-sm font-bold text-white">{p.name}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={p.url} target="_blank"
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors">↗ App</a>
                    </div>
                  </div>

                  {/* Stack */}
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {p.stack.map(s => (
                      <span key={s} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Stats + barra */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${donePct}%`, background: p.color }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 flex-shrink-0">{donePct}%</span>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    {inProgress.length > 0 && <span className="text-amber-400">▶ {inProgress.length} en progreso</span>}
                    {blocked.length    > 0 && <span className="text-rose-400">⊘ {blocked.length} bloqueadas</span>}
                    {open.length       > 0 && <span>○ {open.length} pendientes</span>}
                    {done.length       > 0 && <span className="text-emerald-500">✓ {done.length} completadas</span>}
                    {p.error && <span className="text-rose-400">⚠ {p.error}</span>}
                  </div>
                </div>

                {/* Tareas activas */}
                <div className="p-4 space-y-1.5">
                  {active.length === 0 && done.length > 0 && (
                    <div className="text-center py-6">
                      <span className="text-2xl">🎉</span>
                      <p className="text-xs text-slate-500 mt-1">Todo al corriente · {done.length} completadas</p>
                    </div>
                  )}
                  {active.length === 0 && done.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-500">{p.error ? `Error: ${p.error}` : "Sin tareas"}</p>
                    </div>
                  )}

                  {/* Bloqueadas primero */}
                  {blocked.map(t => <TaskRow key={t.id} task={t} />)}
                  {/* En progreso */}
                  {inProgress.map(t => <TaskRow key={t.id} task={t} />)}
                  {/* Pendientes (máx 5) */}
                  {open.slice(0, 5).map(t => <TaskRow key={t.id} task={t} />)}
                  {open.length > 5 && (
                    <p className="text-[10px] text-slate-600 text-center pt-1">
                      +{open.length - 5} pendientes más en ClickUp
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-700 mt-8">
          Actualizado cada 60s · ClickUp API v2 · {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </main>
    </div>
  );
}
