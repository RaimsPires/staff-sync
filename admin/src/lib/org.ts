import { useMemo } from "react";
import { useSites } from "@/store/sites";
import type { Branch, Site } from "@/types/domain";
import type { ManagedBranch, ManagedSite } from "@/types/site";

/** The company structure as the rest of the app sees it, derived from the sites store. */
export interface Org {
  /** Active sites in active branches: what dashboards, filters and scopes work with. */
  sites: Site[];
  /** Every site, including deactivated ones (for lookups of old records). */
  allSites: Site[];
  /** Active branches with the ids of their active sites. */
  branches: Branch[];
  siteById: (id: string) => Site;
  branchById: (id: string) => Branch | undefined;
  branchOfSite: (siteId: string) => Branch;
  managerOf: (siteId: string) => string;
}

const toSite = (m: ManagedSite): Site => ({
  id: m.id, name: m.name, branchId: m.branchId, address: m.address, position: m.position, geofence: m.geofence,
  manager: m.managers[0] ?? "", phone: m.phone, expected: m.expected, present: m.present, late: m.late, absent: m.absent, flagged: m.flagged, leave: m.leave,
});

export function buildOrg(managedSites: ManagedSite[], managedBranches: ManagedBranch[]): Org {
  const archived = new Set(managedBranches.filter((b) => b.archived).map((b) => b.id));
  const allSites = managedSites.map(toSite);
  const sites = managedSites.filter((m) => m.active && !archived.has(m.branchId)).map(toSite);
  const branchFor = (b: ManagedBranch, from: Site[]): Branch => ({ id: b.id, name: b.name, siteIds: from.filter((s) => s.branchId === b.id).map((s) => s.id) });
  const branches = managedBranches.filter((b) => !b.archived).map((b) => branchFor(b, sites));
  const allBranches = managedBranches.map((b) => branchFor(b, allSites));

  const siteById = (id: string): Site => {
    const site = allSites.find((s) => s.id === id);
    if (!site) throw new Error(`Unknown site: ${id}`);
    return site;
  };
  const branchOfSite = (siteId: string): Branch => {
    const branch = allBranches.find((b) => b.siteIds.includes(siteId));
    if (!branch) throw new Error(`Site without branch: ${siteId}`);
    return branch;
  };
  return {
    sites, allSites, branches, siteById, branchOfSite,
    branchById: (id) => allBranches.find((b) => b.id === id),
    managerOf: (siteId) => siteById(siteId).manager,
  };
}

/** Reactive org for components: re-renders when sites or branches change. */
export function useOrg(): Org {
  const sites = useSites((s) => s.sites);
  const branches = useSites((s) => s.branches);
  return useMemo(() => buildOrg(sites, branches), [sites, branches]);
}

let cache: { sites: ManagedSite[]; branches: ManagedBranch[]; org: Org } | null = null;

/** Current org for code that runs outside React (stores, validators). Not reactive. */
export function getOrg(): Org {
  const { sites, branches } = useSites.getState();
  if (!cache || cache.sites !== sites || cache.branches !== branches) cache = { sites, branches, org: buildOrg(sites, branches) };
  return cache.org;
}
