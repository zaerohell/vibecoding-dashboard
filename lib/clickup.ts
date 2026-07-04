// lib/clickup.ts
import { normalizeStatus } from "./projects";

export type CUTask = {
  id:       string;
  name:     string;
  url:      string;
  status:   "open" | "in_progress" | "done" | "blocked";
  rawStatus: string;
  priority:  number;
  dueDate:   number | null;
  assignee:  string | null;
  tags:      string[];
};

export type ProjectData = {
  listId:  string;
  tasks:   CUTask[];
  error:   string | null;
  fetched: number;
};

function mapTask(t: any): CUTask {
  return {
    id:        t.id,
    name:      t.name,
    url:       t.url,
    status:    normalizeStatus(t.status?.status ?? "open"),
    rawStatus: t.status?.status ?? "open",
    priority:  Number(t.priority?.priority ?? 3),
    dueDate:   t.due_date ? Number(t.due_date) : null,
    assignee:  t.assignees?.[0]?.username ?? null,
    tags:      (t.tags ?? []).map((g: any) => g.name),
  };
}

export async function fetchProjectTasks(listId: string): Promise<ProjectData> {
  const apiKey = process.env.CLICKUP_API_KEY;
  if (!apiKey) {
    return { listId, tasks: [], error: "CLICKUP_API_KEY no configurada", fetched: Date.now() };
  }
  try {
    const res = await fetch(
      `https://api.clickup.com/api/v2/list/${listId}/task?page=0&order_by=updated&reverse=true&include_closed=true`,
      { headers: { Authorization: apiKey }, next: { revalidate: 60 } }
    );
    if (!res.ok) {
      return { listId, tasks: [], error: `ClickUp API ${res.status}`, fetched: Date.now() };
    }
    const data = await res.json();
    return {
      listId,
      tasks:   (data.tasks ?? []).map(mapTask),
      error:   null,
      fetched: Date.now(),
    };
  } catch (e: any) {
    return { listId, tasks: [], error: e?.message, fetched: Date.now() };
  }
}

export async function fetchAllProjects(listIds: readonly string[]): Promise<ProjectData[]> {
  return Promise.all(listIds.map(fetchProjectTasks));
}
