"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, useRef } from "react";

// 5 horas — no es un sitio que se revise constantemente, y esto es lo
// que realmente cuenta contra el CPU activo del plan gratuito de Vercel
// (cada refresh dispara 8 llamadas reales a la API de ClickUp, sin caché).
const INTERVAL = 5 * 60 * 60;

function formatRemaining(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ""}`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export function RefreshBar() {
  const router = useRouter();
  const [seconds, setSeconds]        = useState(INTERVAL);
  const [lastUpdate, setLastUpdate]  = useState<string | null>(null); // null en SSR
  const [isPending, startTransition] = useTransition();
  const hiddenSinceRef = useRef<number | null>(null);

  // Solo en cliente — evita hydration mismatch
  useEffect(() => {
    setLastUpdate(new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  }, []);

  function refresh() {
    startTransition(() => {
      router.refresh();
      setLastUpdate(new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setSeconds(INTERVAL);
    });
  }

  // Pausa el conteo (y por lo tanto las llamadas al servidor) mientras la
  // pestaña no esté visible — no tiene sentido gastar cuota de Vercel
  // refrescando un dashboard que nadie está viendo en ese momento.
  useEffect(() => {
    const tick = setInterval(() => {
      if (document.hidden) return; // pausado — no cuenta tiempo ni refresca
      setSeconds(s => {
        if (s <= 1) { refresh(); return INTERVAL; }
        return s - 1;
      });
    }, 1000);

    function onVisibilityChange() {
      if (document.hidden) {
        hiddenSinceRef.current = Date.now();
      } else if (hiddenSinceRef.current) {
        // Al volver a la pestaña: si ya pasó el intervalo completo mientras
        // estaba oculta, refresca de inmediato en vez de esperar a que se
        // cumpla el conteo (que estuvo pausado todo ese tiempo).
        const hiddenMs = Date.now() - hiddenSinceRef.current;
        if (hiddenMs / 1000 >= INTERVAL) refresh();
        hiddenSinceRef.current = null;
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const pct = ((INTERVAL - seconds) / INTERVAL) * 100;
  const circumference = 2 * Math.PI * 11;

  return (
    <div className="flex items-center gap-3">
      {lastUpdate && (
        <span className="text-xs text-slate-500 hidden sm:block">
          Actualizado {lastUpdate}
        </span>
      )}

      <div className="relative w-7 h-7 flex-shrink-0">
        <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="11" fill="none" stroke="#1e293b" strokeWidth="2.5" />
          <circle cx="14" cy="14" r="11" fill="none" stroke="#f97316" strokeWidth="2.5"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${circumference * (pct / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-slate-400 leading-none">
          {formatRemaining(seconds)}
        </span>
      </div>

      <button onClick={refresh} disabled={isPending} title="Actualizar ahora"
        className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50">
        <svg className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        {isPending ? "Cargando…" : "Refresh"}
      </button>
    </div>
  );
}
