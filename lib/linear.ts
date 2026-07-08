// lib/linear.ts
// Cliente Linear API para sincronización desde ClickUp

const LINEAR_API   = "https://api.linear.app/graphql";
const LINEAR_TOKEN = process.env.LINEAR_API_KEY!;
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID ?? "b1a97a6d-c20c-4606-b045-cef904de8db6";

// ── Estado IDs del team "Proyectos CRM" (hardcoded para evitar query extra) ──
const STATE_IDS: Record<string, string> = {
  "Todo":        "f48c4c7c-6168-4875-80d8-bc7d0507f1c8",
  "In Progress": "4563b150-c4b6-4a53-9917-074b16ac3a78",
  "In Review":   "31fb071e-8143-4bf5-8b08-de476125c02e",
  "Done":        "0c265fbe-d948-4da4-8906-430996b6dd7c",
  "Backlog":     "02f71a44-cbf4-40ee-adf2-6e6423ca3c04",
  "Cancelled":   "ce96fa25-472c-45c4-9d96-45692de85331",
};

// ── Mapa status ClickUp (español/inglés) → nombre estado Linear ──
export const STATUS_MAP: Record<string, string> = {
  "pendiente":    "Todo",
  "en progreso":  "In Progress",
  "en curso":     "In Progress",
  "completadas":  "Done",
  "completado":   "Done",
  "bloqueada":    "In Progress",
  "bloqueado":    "In Progress",
  "open":         "Todo",
  "in progress":  "In Progress",
  "done":         "Done",
  "closed":       "Done",
};

// ── Mapa prioridad ClickUp → Linear ──
// ClickUp: 1=urgent, 2=high, 3=normal, 4=low
// Linear:  0=no priority, 1=urgent, 2=high, 3=medium, 4=low
export const PRIORITY_MAP: Record<number, number> = {
  1: 1, 2: 2, 3: 3, 4: 4,
};

// ── Mapa list IDs ClickUp → proyecto Linear ──
export const LIST_TO_PROJECT: Record<string, { project: string; label: string }> = {
  "901416845643": { project: "PlayaMXCRM",     label: "playamx"    },
  "901416845673": { project: "Lavanderia CRM",  label: "lavanderia" },
  "901416845649": { project: "Rectificadora",   label: "riviera"    },
  "901416845658": { project: "Ismerely-KB",     label: "bienestar"  },
};

// ── Label IDs del team (hardcoded para evitar query extra) ──
const LABEL_IDS: Record<string, string> = {
  "playamx":    "9f72fb1c-2cd6-4264-861a-e4d35e100e31",
  "lavanderia": "67624efe-fbde-43d7-a621-84405eb4d29b",
  "riviera":    "6115a30c-fef1-4801-bd00-c35ed5c18dc2",
  "bienestar":  "d6eaa128-0660-409e-a27a-4e3971b19a79",
};

// ── GraphQL helper ──
async function linearQuery(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: LINEAR_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Linear API HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`Linear GQL: ${json.errors[0].message}`);
  return json.data;
}

// ── Busca un issue en Linear por título ──
export async function findLinearIssue(taskName: string) {
  const data = await linearQuery(`
    query SearchIssue($query: String!) {
      issueSearch(query: $query, first: 3, filter: {
        team: { id: { eq: "${LINEAR_TEAM_ID}" } }
      }) {
        nodes { id identifier title state { name } priority }
      }
    }
  `, { query: taskName });

  // Buscar coincidencia exacta de título
  const exact = data.issueSearch.nodes.find(
    (n: { title: string }) => n.title.toLowerCase() === taskName.toLowerCase()
  );
  return exact ?? data.issueSearch.nodes[0] ?? null;
}

// ── Actualiza el estado de un issue en Linear ──
export async function updateLinearIssueState(issueId: string, clickupStatus: string) {
  const linearStateName = STATUS_MAP[clickupStatus.toLowerCase()] ?? "Todo";
  const stateId = STATE_IDS[linearStateName];
  if (!stateId) {
    console.warn(`[linear] No stateId for "${linearStateName}"`);
    return null;
  }

  const data = await linearQuery(`
    mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) {
        success
        issue { id identifier title state { name } url }
      }
    }
  `, { id: issueId, input: { stateId } });

  return data.issueUpdate.issue;
}

// ── Crea un issue nuevo en Linear desde ClickUp ──
export async function createLinearIssue(params: {
  title: string;
  description: string;
  priority: number;
  listId: string;
  clickupUrl: string;
}) {
  const project = LIST_TO_PROJECT[params.listId];
  const labelId = project ? LABEL_IDS[project.label] : null;
  const stateId = STATE_IDS["Todo"];

  const input: Record<string, unknown> = {
    title: params.title,
    description: `${params.description}\n\n🔗 ClickUp: ${params.clickupUrl}\n🤖 Sync automático VibeCoding`,
    priority: PRIORITY_MAP[params.priority] ?? 3,
    teamId: LINEAR_TEAM_ID,
    stateId,
  };
  if (labelId) input.labelIds = [labelId];

  const data = await linearQuery(`
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier title url }
      }
    }
  `, { input });

  return data.issueCreate.issue;
}
