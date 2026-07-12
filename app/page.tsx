import { PROJECTS, normalizeStatus, PRIORITY_ICON } from "@/lib/projects";
import { fetchAllProjects } from "@/lib/clickup";
import DashboardClient from "./DashboardClient";

export const dynamic   = "force-dynamic";
export const revalidate = 60;

export default async function HomePage() {
  const allData  = await fetchAllProjects(PROJECTS.map(p => p.listId));
  const projects = PROJECTS.map((p, i) => ({
    ...p,
    tasks:  allData[i]?.tasks  ?? [],
    error:  allData[i]?.error,
  }));

  return <DashboardClient projects={projects as any} />;
}
