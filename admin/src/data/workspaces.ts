import type { Workspace } from "@/types/workspace";

export const WORKSPACES: Workspace[] = [
  {
    id: "bp", name: "Batiplus Group", mono: "B", logo: "#0D1B2E", role: "admin",
    employees: 198, sites: 5, lastAccess: { kind: "today", time: "08:12" }, isLastUsed: true,
  },
  {
    id: "nr", name: "Nettoyage Rhône Services", mono: "NR", logo: "oklch(0.55 0.13 160)", role: "branch",
    scopeName: "Lyon", employees: 86, sites: 12, lastAccess: { kind: "yesterday", time: "17:40" },
  },
  {
    id: "sp", name: "SécuriPort Marseille", mono: "SP", logo: "oklch(0.55 0.15 25)", role: "site",
    scopeName: "Port Vieux Yard", employees: 42, sites: 3, lastAccess: { kind: "date", iso: "2026-10-12" },
  },
  {
    id: "ld", name: "Logistique Delta", mono: "LD", logo: "oklch(0.5 0.14 290)", role: "branch",
    scopeName: "Paris Nord", employees: 310, sites: 9, lastAccess: { kind: "date", iso: "2026-09-28" },
  },
  {
    id: "am", name: "Atelier Moreau & Fils", mono: "AM", logo: "oklch(0.6 0.1 70)", role: "admin",
    employees: 14, sites: 1, lastAccess: { kind: "date", iso: "2026-08-02" }, suspended: true,
  },
];
