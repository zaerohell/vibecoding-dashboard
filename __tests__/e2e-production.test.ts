/**
 * e2e-production.test.ts — VibeCoding Dashboard contra producción real (Vercel)
 *
 * Solo lectura — NUNCA dispara POST /api/sync en automatizado: ese
 * webhook crea/actualiza issues reales en Linear (ClickUp → Linear).
 * Se prueba manualmente disparando un evento real desde ClickUp o con
 * el webhook real de ClickUp (firmado con CLICKUP_WEBHOOK_SECRET).
 *
 * Ejecutar:
 *   E2E_BASE_URL="https://vibecoding-dashboard-amber.vercel.app" \
 *   npx vitest run __tests__/e2e-production.test.ts
 */
import { describe, it, expect } from "vitest";

const BASE = process.env.E2E_BASE_URL ?? "https://vibecoding-dashboard-amber.vercel.app";

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  const text = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* la home no es JSON */ }
  return { status: res.status, text, json };
}

describe("E2E Producción — Health / disponibilidad", () => {
  it("GET / responde 200", async () => {
    const res = await get("/");
    expect(res.status).toBe(200);
  }, 15_000);

  it("GET /api/sync responde 200 (health check del webhook)", async () => {
    const res = await get("/api/sync");
    expect(res.status).toBe(200);
  }, 15_000);
});

describe("E2E Producción — GET /api/sync (health check del webhook)", () => {
  it("devuelve status ok y metadata del endpoint", async () => {
    const res = await get("/api/sync");
    const body = res.json as { status: string; endpoint: string; version: string };
    expect(body.status).toBe("ok");
    expect(body.endpoint).toContain("ClickUp");
    expect(body.endpoint).toContain("Linear");
    expect(typeof body.version).toBe("string");
  }, 15_000);

  it("devuelve watchedLists con al menos 1 lista de ClickUp configurada", async () => {
    const res = await get("/api/sync");
    const body = res.json as { watchedLists: string[] };
    expect(Array.isArray(body.watchedLists)).toBe(true);
    expect(body.watchedLists.length).toBeGreaterThan(0);
  }, 15_000);

  it("devuelve statusMap con las traducciones ClickUp→Linear esperadas", async () => {
    const res = await get("/api/sync");
    const body = res.json as { statusMap: Record<string, string> };
    expect(body.statusMap["pendiente"]).toBe("Todo");
    expect(body.statusMap["en progreso"]).toBe("In Progress");
    expect(body.statusMap["completadas"]).toBe("Done");
  }, 15_000);

  // NOTA DELIBERADA: sin test de POST /api/sync. Ese endpoint, con un
  // evento taskCreated/taskStatusUpdated válido, crea o actualiza issues
  // reales en Linear. Se prueba manualmente vía el webhook real de
  // ClickUp o con una llamada firmada manual, nunca en CI automatizado.
});

describe("E2E Producción — GET / (dashboard principal)", () => {
  it("renderiza el header VibeCoding", async () => {
    const res = await get("/");
    expect(res.text).toContain("VibeCoding");
  }, 15_000);

  it("renderiza la sección de KPIs (Total tareas)", async () => {
    const res = await get("/");
    expect(res.text).toContain("Total tareas");
  }, 15_000);

  it("NO muestra el warning de CLICKUP_API_KEY faltante (confirma que está configurada en Vercel)", async () => {
    const res = await get("/");
    expect(res.text).not.toContain("CLICKUP_API_KEY no configurada");
  }, 15_000);

  it("no expone stack traces ni errores 500 crudos en el HTML", async () => {
    const res = await get("/");
    expect(res.text.toLowerCase()).not.toContain("internal server error");
    expect(res.text).not.toContain("at Object.<anonymous>");
  }, 15_000);
});
