"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const INTERVAL = 60; // segundos

export function RefreshBar() {
  const router = useRouter();
  const [seconds, setSeconds]       = useState(INTERVAL);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => {
      router.refresh();
      setLastUpdate(new Date());
      setSeconds(INTERVAL);
    });
  }

  // Cuenta regresiva — al llegar a 0 dispara refresh automático
  useEffect(() => {
    const tick = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { refresh(); return INTERVAL; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const pct = ((INTERVAL - seconds) / INTERVAL) * 100;
  const circumference = 2 * Math.PI * 11;

  return (
    <div className="flex items-center gap-3">
      {/* Última actualización */}
      <span className="text-xs text-slate-500 hidden sm:block">
        Actualizado {lastUpdate.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>

      {/* Círculo de cuenta regresiva */}
      <div className="relative w-7 h-7 flex-shrink-0">
        <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="11" fill="none" stroke="#1e293b" strokeWidth="2.5" />
          <circle cx="14" cy="14" r="11" fill="none" stroke="#f97316" strokeWidth="2.5"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${circumference * (pct / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-400">
          {seconds}
        </span>
      </div>

      {/* Botón refresh manual */}
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
