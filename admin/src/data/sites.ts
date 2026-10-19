import { SEED_SITES } from "@/data/org";
import type { ManagedBranch, ManagedSite } from "@/types/site";

const EXTRA = {
  pd: { code: "PDT", employees: 42, managers: ["Nadia Koné"], selfie: true, qr: true },
  cf: { code: "CFD", employees: 31, managers: ["Julien Roche"], selfie: true, qr: false },
  sd: { code: "SDH", employees: 58, managers: ["Marc Olivier"], selfie: false, qr: true },
  rl: { code: "RLG", employees: 47, managers: ["Marc Olivier"], selfie: true, qr: true },
  pv: { code: "PVY", employees: 36, managers: ["Sarah Benoît"], selfie: true, qr: false },
} as const;

const base = (s: (typeof SEED_SITES)[number]): ManagedSite => {
  const x = EXTRA[s.id as keyof typeof EXTRA];
  return {
    id: s.id, name: s.name, code: x.code, branchId: s.branchId, address: s.address, timezone: "Europe/Paris", position: s.position, geofence: s.geofence,
    managers: [...x.managers], phone: s.phone, employees: x.employees, expected: s.expected, present: s.present, late: s.late, absent: s.absent, flagged: s.flagged, leave: s.leave, requireSelfie: x.selfie, requireQr: x.qr,
    registeredDeviceOnly: false, allowOffline: true, minAccuracy: 50, active: true, hours: { start: "08:00", end: "16:00", breakMinutes: 30 },
  };
};

export const MANAGED_SITES: ManagedSite[] = [
  ...SEED_SITES.map(base),
  {
    id: "bx", name: "Bordeaux Dock", code: "BDX", branchId: "bdx", address: "5 Cours du Médoc, Bordeaux", timezone: "Europe/Paris", position: [44.8626, -0.5612],
    geofence: { kind: "circle", radius: 220 }, managers: ["Hugo Martel"], phone: "", employees: 0, expected: 0, present: 0, late: 0, absent: 0, flagged: 0, leave: 0, requireSelfie: false, requireQr: true,
    registeredDeviceOnly: false, allowOffline: true, minAccuracy: 50, active: false, hours: { start: "08:00", end: "16:00", breakMinutes: 30 },
  },
  {
    id: "li", name: "Lille Annex", code: "LIL", branchId: "pn", address: "17 Rue Solférino, Lille", timezone: "Europe/Paris", position: [50.6292, 3.0573],
    geofence: { kind: "circle", radius: 120 }, managers: ["Marc Olivier"], phone: "", employees: 12, expected: 10, present: 7, late: 1, absent: 1, flagged: 0, leave: 1, requireSelfie: true, requireQr: true,
    registeredDeviceOnly: false, allowOffline: true, minAccuracy: 50, active: true, hours: { start: "08:00", end: "16:00", breakMinutes: 30 },
  },
];

export const MANAGED_BRANCHES: ManagedBranch[] = [
  { id: "lyon", name: "Lyon", code: "LYO", address: "12 Rue de la Part-Dieu, 69003 Lyon", timezone: "Europe/Paris", admins: ["Nadia Koné", "Julien Roche"], holidays: "fr", workflow: "default", rate: 93, archived: false },
  { id: "pn", name: "Paris Nord", code: "PAN", address: "88 Avenue du Président Wilson, 93210 Saint-Denis", timezone: "Europe/Paris", admins: ["Marc Olivier"], holidays: "fr", workflow: "two", rate: 89, archived: false },
  { id: "mrs", name: "Marseille", code: "MRS", address: "21 Quai du Port, 13002 Marseille", timezone: "Europe/Paris", admins: ["Sarah Benoît"], holidays: "fr", workflow: "auto", rate: 96, archived: false },
  { id: "bdx", name: "Bordeaux", code: "BDX", address: "5 Cours du Médoc, 33300 Bordeaux", timezone: "Europe/Paris", admins: [], holidays: "fr", workflow: "default", rate: 0, archived: true },
];

export const MANAGER_POOL = [
  { name: "Nadia Koné", role: "branchManager", phone: "06 21 18 44 70" },
  { name: "Julien Roche", role: "siteManager", phone: "06 33 70 12 08" },
  { name: "Marc Olivier", role: "siteManager", phone: "06 20 81 37 52" },
  { name: "Sarah Benoît", role: "siteManager", phone: "06 48 02 91 15" },
  { name: "Hugo Martel", role: "teamLead", phone: "06 72 55 31 64" },
] as const;

export const ADMIN_POOL = ["Nadia Koné", "Julien Roche", "Marc Olivier", "Sarah Benoît", "Claire Vasseur", "Hugo Martel"];
export const TIMEZONES_EU = ["Europe/Paris", "Europe/London", "Europe/Brussels", "Europe/Madrid", "Indian/Reunion", "America/Martinique"];
