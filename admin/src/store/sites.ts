import { create } from "zustand";
import { MANAGED_BRANCHES, MANAGED_SITES } from "@/data/sites";
import type { ManagedBranch, ManagedSite } from "@/types/site";

interface SitesState {
  sites: ManagedSite[];
  branches: ManagedBranch[];
  /** Creates (no id) or updates a site and returns its id. */
  saveSite: (site: Omit<ManagedSite, "id"> & { id?: string }) => string;
  patchSite: (id: string, patch: Partial<ManagedSite>) => void;
  saveBranch: (branch: ManagedBranch) => void;
  /** Archives (or deletes) a branch, moving its active sites to `moveTo` first when given. */
  retireBranch: (id: string, mode: "archive" | "delete", moveTo?: string) => void;
  restoreBranch: (id: string) => void;
}

export const useSites = create<SitesState>((set) => ({
  sites: MANAGED_SITES,
  branches: MANAGED_BRANCHES,
  saveSite: (input) => {
    const id = input.id ?? `n${Date.now()}`;
    const site: ManagedSite = { ...input, id };
    set((s) => ({ sites: s.sites.some((x) => x.id === id) ? s.sites.map((x) => (x.id === id ? site : x)) : [...s.sites, site] }));
    return id;
  },
  patchSite: (id, patch) => set((s) => ({ sites: s.sites.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
  saveBranch: (branch) => set((s) => ({ branches: s.branches.some((b) => b.id === branch.id) ? s.branches.map((b) => (b.id === branch.id ? branch : b)) : [...s.branches, branch] })),
  retireBranch: (id, mode, moveTo) =>
    set((s) => ({
      sites: moveTo ? s.sites.map((x) => (x.branchId === id ? { ...x, branchId: moveTo } : x)) : s.sites,
      branches: mode === "delete" ? s.branches.filter((b) => b.id !== id) : s.branches.map((b) => (b.id === id ? { ...b, archived: true } : b)),
    })),
  restoreBranch: (id) => set((s) => ({ branches: s.branches.map((b) => (b.id === id ? { ...b, archived: false } : b)) })),
}));

export const siteRate = (s: ManagedSite): number => (s.active && s.expected ? Math.round((s.present / s.expected) * 100) : 0);
