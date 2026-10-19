import type { Branch, Site } from "@/types/domain";

export const BRANCHES: Branch[] = [
  { id: "lyon", name: "Lyon", siteIds: ["pd", "cf"] },
  { id: "pn", name: "Paris Nord", siteIds: ["sd", "rl"] },
  { id: "mrs", name: "Marseille", siteIds: ["pv"] },
];

export const COMPANY_NAME = "Batiplus Group";
export const COMPANY_EMPLOYEES = 198;

export const SITES: Site[] = [
  {
    id: "pd", name: "Part-Dieu Tower", branchId: "lyon", address: "17 Bd Vivier-Merle, Lyon",
    position: [45.7605, 4.859], geofence: { kind: "circle", radius: 150 },
    manager: "Nadia Koné", phone: "+33 6 12 44 80",
    expected: 48, present: 41, late: 4, absent: 3, flagged: 0, leave: 2,
  },
  {
    id: "cf", name: "Confluence Depot", branchId: "lyon", address: "52 Quai Rambaud, Lyon",
    position: [45.7425, 4.8176],
    geofence: {
      kind: "polygon", hectares: 1.8,
      points: [[45.7436, 4.8158], [45.7438, 4.8194], [45.7421, 4.8199], [45.7412, 4.8172], [45.7425, 4.8155]],
    },
    manager: "Julien Robert", phone: "+33 6 21 37 52",
    expected: 32, present: 28, late: 2, absent: 1, flagged: 1, leave: 2,
  },
  {
    id: "sd", name: "Saint-Denis Hub", branchId: "pn", address: "8 Rue du Landy, Saint-Denis",
    position: [48.9362, 2.3574],
    geofence: {
      kind: "polygon", hectares: 2.6,
      points: [[48.9378, 2.3548], [48.9381, 2.3601], [48.9356, 2.3606], [48.9347, 2.3562]],
    },
    manager: "Amina Traoré", phone: "+33 7 81 22 19",
    expected: 56, present: 47, late: 6, absent: 3, flagged: 2, leave: 4,
  },
  {
    id: "rl", name: "Roissy Logistics", branchId: "pn", address: "Zone Cargo 4, Roissy",
    position: [49.0097, 2.5479], geofence: { kind: "circle", radius: 200 },
    manager: "Olivier Dubois", phone: "+33 6 55 09 63",
    expected: 38, present: 33, late: 3, absent: 2, flagged: 0, leave: 3,
  },
  {
    id: "pv", name: "Port Vieux Yard", branchId: "mrs", address: "Quai de Rive Neuve, Marseille",
    position: [43.2951, 5.3667],
    geofence: {
      kind: "polygon", hectares: 1.2,
      points: [[43.2962, 5.3651], [43.2964, 5.3683], [43.2947, 5.3688], [43.2939, 5.3660]],
    },
    manager: "Karine Faure", phone: "+33 6 40 18 27",
    expected: 24, present: 19, late: 1, absent: 2, flagged: 1, leave: 2,
  },
];

export const siteById = (id: string): Site => {
  const site = SITES.find((s) => s.id === id);
  if (!site) throw new Error(`Unknown site: ${id}`);
  return site;
};

export const branchById = (id: string): Branch | undefined => BRANCHES.find((b) => b.id === id);
export const branchOfSite = (siteId: string): Branch => {
  const b = BRANCHES.find((x) => x.siteIds.includes(siteId));
  if (!b) throw new Error(`Site without branch: ${siteId}`);
  return b;
};

/** Manager of a site, used as the default "proxy by" name. */
export const managerOf = (siteId: string): string => siteById(siteId).manager;
