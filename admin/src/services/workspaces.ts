import { WORKSPACES } from "@/data/workspaces";
import type { Workspace } from "@/types/workspace";

/** Companies the signed-in user belongs to. Swap for an API call when the backend is wired. */
export async function listWorkspaces(): Promise<Workspace[]> {
  return WORKSPACES;
}
