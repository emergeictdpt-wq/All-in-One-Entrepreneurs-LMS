import type { AdminProgram } from "../types";

/** Value of the "All Projects" choice in the Incubation Management navbar. */
export const ALL_PROJECTS = "all";
/** The admin's last choice is remembered per browser tab. */
export const SELECTED_PROJECT_KEY = "emerge.incubation.project";

/** `allowed`: when set, "All Projects" means "all of the signed-in manager's projects". Records of other managers' projects stay hidden. */
export type ProjectScope = { projectId: string; project: AdminProgram | null; allowed?: string[] };
export const ALL_SCOPE: ProjectScope = { projectId: ALL_PROJECTS, project: null };

/** A project is "completed" once its status is Closed or Completed; every other status is a current/rolling project. */
export const isCompletedProject = (p: AdminProgram) => p.status === "Closed" || p.status === "Completed";

/** Projects the admin can pick: everything that has not been unpublished. Newly created projects appear here automatically. */
export const listableProjects = (programs: AdminProgram[]) => programs.filter(p => p.published);

export function splitProjects(programs: AdminProgram[]) {
  const all = listableProjects(programs);
  return { current: all.filter(p => !isCompletedProject(p)), completed: all.filter(isCompletedProject) };
}

/** Entrepreneur-side records belong to exactly one project. With "All Projects" selected, a manager sees every project they champion
 *  (plus records that never chose a project); a scope without `allowed` sees everything. */
export const inScope = (scope: ProjectScope, item: { programId?: string }) =>
  scope.project ? item.programId === scope.project.id
    : !scope.allowed || !item.programId || scope.allowed.includes(item.programId);

/** Mentors who registered without choosing a project form a programme-wide pool and stay visible in every project. */
export const mentorInScope = (scope: ProjectScope, item: { programId?: string }) =>
  !item.programId || inScope(scope, item);
