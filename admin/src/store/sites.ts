import { create } from "zustand";
import { MANAGED_BRANCHES, MANAGED_SITES } from "@/data/sites";
import { useSyncError } from "@/store/sync-error";
import type { ManagedBranch, ManagedSite } from "@/types/site";

type SiteInput = Omit<ManagedSite, "id"> & { id?: string };

/** Persistence behind the store: set by `services/org` once the user is signed in; absent means local-only (demo data). */
export interface SitesRemote {
  createSite: (site: SiteInput) => Promise<ManagedSite>;
  updateSite: (id: string, patch: Partial<ManagedSite>) => Promise<void>;
  saveBranch: (branch: ManagedBranch, isNew: boolean) => Promise<ManagedBranch>;
  retireBranch: (id: string, mode: "archive" | "delete", moveTo?: string) => Promise<void>;
  restoreBranch: (id: string) => Promise<void>;
  /** Re-read everything from the API (used to roll back a failed save). */
  reload: () => Promise<void>;
}
export const sitesRemote: { current: SitesRemote | null } = { current: null };

interface SitesState {
  sites: ManagedSite[];
  branches: ManagedBranch[];
  /** Creates (no id) or updates a site and resolves with its id. */
  saveSite: (site: SiteInput) => Promise<string>;
  patchSite: (id: string, patch: Partial<ManagedSite>) => void;
  /** Creates (empty id) or updates a branch and resolves with its id. */
  saveBranch: (branch: ManagedBranch) => Promise<string>;
  /** Archives (or deletes) a branch, moving its active sites to `moveTo` first when given. */
  retireBranch: (id: string, mode: "archive" | "delete", moveTo?: string) => void;
  restoreBranch: (id: string) => void;
}

/** Apply an optimistic change, send it, and roll back by reloading when the server refuses. */
function optimistic(send: ((r: SitesRemote) => Promise<unknown>) | null) {
  const remote = sitesRemote.current;
  if (!remote || !send) return;
  send(remote).catch((e: unknown) => {
    useSyncError.getState().report(e instanceof Error ? e.message : "Couldn’t save the change");
    void remote.reload();
  });
}

export const useSites = create<SitesState>((set, get) => ({
  sites: MANAGED_SITES,
  branches: MANAGED_BRANCHES,
  saveSite: async (input) => {
    const remote = sitesRemote.current;
    const existing = input.id ? get().sites.find((x) => x.id === input.id) : undefined;
    if (remote && !existing) {
      const created = await remote.createSite(input);
      set((s) => ({ sites: [...s.sites, created] }));
      return created.id;
    }
    const id = input.id ?? `n${Date.now()}`;
    const site: ManagedSite = { ...input, id };
    set((s) => ({ sites: s.sites.some((x) => x.id === id) ? s.sites.map((x) => (x.id === id ? site : x)) : [...s.sites, site] }));
    optimistic(remote && ((r) => r.updateSite(id, site)));
    return id;
  },
  patchSite: (id, patch) => {
    set((s) => ({ sites: s.sites.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    optimistic((r) => r.updateSite(id, patch));
  },
  saveBranch: async (branch) => {
    const remote = sitesRemote.current;
    const isNew = !get().branches.some((b) => b.id === branch.id);
    const saved = remote ? await remote.saveBranch(branch, isNew) : branch;
    set((s) => ({ branches: s.branches.some((b) => b.id === saved.id) ? s.branches.map((b) => (b.id === saved.id ? saved : b)) : [...s.branches, saved] }));
    return saved.id;
  },
  retireBranch: (id, mode, moveTo) => {
    set((s) => ({
      sites: moveTo ? s.sites.map((x) => (x.branchId === id ? { ...x, branchId: moveTo } : x)) : s.sites,
      branches: mode === "delete" ? s.branches.filter((b) => b.id !== id) : s.branches.map((b) => (b.id === id ? { ...b, archived: true } : b)),
    }));
    optimistic((r) => r.retireBranch(id, mode, moveTo));
  },
  restoreBranch: (id) => {
    set((s) => ({ branches: s.branches.map((b) => (b.id === id ? { ...b, archived: false } : b)) }));
    optimistic((r) => r.restoreBranch(id));
  },
}));

export const siteRate = (s: ManagedSite): number => (s.active && s.expected ? Math.round((s.present / s.expected) * 100) : 0);
