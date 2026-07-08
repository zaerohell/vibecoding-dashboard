// app/api/sync/route.ts
// Webhook endpoint: ClickUp → Linear
// ClickUp llama a este endpoint cuando una tarea cambia de status

import { NextRequest, NextResponse } from "next/server";
import {
  findLinearIssue,
  updateLinearIssueState,
  createLinearIssue,
  LIST_TO_PROJECT,
  STATUS_MAP,
} from "@/lib/linear";

// IDs de listas que sincronizamos
const WATCHED_LISTS = new Set(Object.keys(LIST_TO_PROJECT));

// Verifica la firma del webhook de ClickUp
function verifySignature(body: string, signature: string | null): boolean {
  // ClickUp firma con HMAC-SHA256 si tienes el secret configurado
  // Si no hay secret configurado, acepta todo (solo para desarrollo)
  const secret = process.env.CLICKUP_WEBHOOK_SECRET;
  if (!secret) return true; // dev mode
  if (!signature) return false;

  // En producción verificar con crypto
  try {
    const crypto = require("crypto");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    return signature === expected;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  // Verificar firma
  if (!verifySignature(rawBody, signature)) {
    console.error("[sync] Invalid webhook signature");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event;
  const task  = payload.task_id ? payload : payload.history_items?.[0];

  // Solo procesamos eventos de cambio de status y creación de tarea
  if (!["taskStatusUpdated", "taskCreated"].includes(event)) {
    return NextResponse.json({ skipped: true, event });
  }

  const taskId   = payload.task_id ?? task?.task_id;
  const listId   = payload.list?.id ?? task?.list_id;
  const taskName = payload.task?.name ?? task?.task?.name ?? "";
  const status   = payload.task?.status?.status ?? task?.after ?? "";
  const taskUrl  = payload.task?.url ?? `https://app.clickup.com/t/${taskId}`;
  const priority = payload.task?.priority?.priority ?? 3;
  const description = payload.task?.description ?? "";

  // Solo sincronizamos listas configuradas
  if (!WATCHED_LISTS.has(listId)) {
    return NextResponse.json({ skipped: true, reason: "list not watched", listId });
  }

  // Ignorar tareas de content-automation (alertas automáticas)
  if (taskName.includes("Sin commits hoy") || taskName.includes("content-auto")) {
    return NextResponse.json({ skipped: true, reason: "automation task" });
  }

  // Ignorar tareas completadas triviales (basura limpiada)
  if (taskName.startsWith("🔴") || taskName.startsWith("PLANTILLA")) {
    return NextResponse.json({ skipped: true, reason: "template or alert task" });
  }

  console.log(`[sync] ${event} | task: "${taskName}" | status: "${status}" | list: ${listId}`);

  try {
    // Buscar si ya existe en Linear
    const existing = await findLinearIssue(taskName, taskId);

    if (existing) {
      // Actualizar estado en Linear
      const updated = await updateLinearIssueState(existing.id, status);
      console.log(`[sync] Updated Linear ${existing.identifier} → ${STATUS_MAP[status.toLowerCase()] ?? status}`);
      return NextResponse.json({
        action: "updated",
        linear: updated?.identifier,
        status: STATUS_MAP[status.toLowerCase()] ?? status,
      });
    } else if (event === "taskCreated") {
      // Crear issue nuevo en Linear solo si es una tarea nueva real
      const created = await createLinearIssue({
        title: taskName,
        description,
        priority: Number(priority),
        listId,
        clickupUrl: taskUrl,
        clickupTaskId: taskId,
      });
      console.log(`[sync] Created Linear ${created?.identifier} from ClickUp task`);
      return NextResponse.json({
        action: "created",
        linear: created?.identifier,
        url: created?.url,
      });
    } else {
      // Status update pero no existe en Linear — skip silencioso
      return NextResponse.json({
        action: "skipped",
        reason: "issue not found in Linear — only syncing status updates for existing issues",
      });
    }
  } catch (err: any) {
    console.error("[sync] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET para verificar que el endpoint está vivo (ClickUp lo hace al registrar el webhook)
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "ClickUp → Linear sync webhook",
    version: "1.0.0",
    watchedLists: Object.keys(LIST_TO_PROJECT),
    statusMap: STATUS_MAP,
  });
}
