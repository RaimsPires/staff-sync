import type { Role } from "./auth";

/** When a workspace was last opened. Dates are rendered with the active locale. */
export type LastAccess =
  | { kind: "today"; time: string }
  | { kind: "yesterday"; time: string }
  | { kind: "date"; iso: string };

export interface Workspace {
  id: string;
  name: string;
  /** One or two letters shown in the logo tile. */
  mono: string;
  /** Logo tile background (any CSS colour). */
  logo: string;
  role: Role;
  /** Branch or site name; omitted when the role covers the whole company. */
  scopeName?: string;
  employees: number;
  sites: number;
  lastAccess: LastAccess;
  isLastUsed?: boolean;
  /** Trial ended: the workspace cannot be opened until a plan is chosen. */
  suspended?: boolean;
}
