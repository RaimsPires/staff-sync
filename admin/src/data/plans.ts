import type { FeatureValue, Plan, PlanFeature, Subscription } from "@/types/plans";

/** Comparison rows, in display order. The backend owns this list. */
export const SEED_FEATURES: PlanFeature[] = [
  { id: "employees", group: "usage", kind: "number", label: { en: "Employees", fr: "Employés" } },
  { id: "branches", group: "usage", kind: "number", label: { en: "Branches", fr: "Branches" } },
  { id: "sites", group: "usage", kind: "number", label: { en: "Sites", fr: "Sites" } },
  { id: "admins", group: "usage", kind: "number", label: { en: "Dashboard users", fr: "Utilisateurs du tableau de bord" } },
  { id: "history", group: "usage", kind: "number", label: { en: "Attendance history", fr: "Historique de présence" }, unit: { en: "mo", fr: "mois" } },

  { id: "mobile", group: "tracking", kind: "bool", label: { en: "Mobile check-in with geofence", fr: "Pointage mobile avec géorepérage" } },
  { id: "qr", group: "tracking", kind: "bool", label: { en: "QR kiosk check-in", fr: "Pointage par borne QR" } },
  { id: "fraud", group: "tracking", kind: "bool", label: { en: "Fraud flags & GPS proof", fr: "Alertes de fraude et preuve GPS" } },
  { id: "behalf", group: "tracking", kind: "bool", label: { en: "Check-in on behalf", fr: "Pointage pour un tiers" } },
  { id: "polygon", group: "tracking", kind: "bool", label: { en: "Polygon geofences", fr: "Géorepérages polygonaux" } },

  { id: "leave", group: "management", kind: "bool", label: { en: "Leave requests", fr: "Demandes de congés" } },
  { id: "schedules", group: "management", kind: "bool", label: { en: "Schedules & interventions", fr: "Plannings et interventions" } },
  { id: "scopedRoles", group: "management", kind: "bool", label: { en: "Branch & site-level roles", fr: "Rôles par branche et par site" } },
  { id: "reports", group: "management", kind: "bool", label: { en: "Scheduled reports", fr: "Rapports planifiés" } },
  { id: "payroll", group: "management", kind: "bool", label: { en: "Payroll exports", fr: "Exports de paie" } },
  { id: "api", group: "management", kind: "bool", label: { en: "API & webhooks", fr: "API et webhooks" } },

  { id: "twoFactor", group: "security", kind: "bool", label: { en: "Two-factor authentication", fr: "Authentification à deux facteurs" } },
  { id: "audit", group: "security", kind: "bool", label: { en: "Audit log", fr: "Journal d’audit" } },
  { id: "sso", group: "security", kind: "bool", label: { en: "SSO & SCIM", fr: "SSO et SCIM" } },
  { id: "retention", group: "security", kind: "bool", label: { en: "Custom data retention", fr: "Durée de conservation personnalisée" } },

  { id: "support", group: "support", kind: "bool", label: { en: "Email support", fr: "Support par e-mail" } },
  { id: "priority", group: "support", kind: "bool", label: { en: "Priority support", fr: "Support prioritaire" } },
  { id: "manager", group: "support", kind: "bool", label: { en: "Dedicated success manager", fr: "Responsable de compte dédié" } },
];

const values = (v: Record<string, FeatureValue>): Record<string, FeatureValue> => v;

export const SEED_PLANS: Plan[] = [
  {
    id: "starter",
    name: { en: "Starter", fr: "Starter" },
    tagline: { en: "For small teams with a few sites.", fr: "Pour les petites équipes avec quelques sites." },
    price: { monthly: 3, yearly: 2.4 },
    employeeCap: 50, recommended: false, active: true,
    highlights: ["employees", "fraud", "behalf"],
    values: values({
      employees: 50, branches: 2, sites: null, admins: 5, history: 6,
      mobile: true, qr: true, fraud: true, behalf: true, polygon: false,
      leave: true, schedules: true, scopedRoles: false, reports: false, payroll: false, api: false,
      twoFactor: true, audit: true, sso: false, retention: false,
      support: true, priority: false, manager: false,
    }),
  },
  {
    id: "business",
    name: { en: "Business", fr: "Business" },
    tagline: { en: "For growing companies with several branches.", fr: "Pour les entreprises en croissance avec plusieurs branches." },
    price: { monthly: 5, yearly: 4 },
    employeeCap: 250, recommended: true, active: true,
    highlights: ["employees", "scopedRoles", "polygon", "payroll"],
    values: values({
      employees: 250, branches: null, sites: null, admins: 25, history: 24,
      mobile: true, qr: true, fraud: true, behalf: true, polygon: true,
      leave: true, schedules: true, scopedRoles: true, reports: true, payroll: true, api: true,
      twoFactor: true, audit: true, sso: false, retention: false,
      support: true, priority: true, manager: false,
    }),
  },
  {
    id: "enterprise",
    name: { en: "Enterprise", fr: "Entreprise" },
    tagline: { en: "For large organisations with custom needs.", fr: "Pour les grandes organisations aux besoins spécifiques." },
    price: null,
    employeeCap: null, recommended: false, active: true,
    highlights: ["sso", "retention", "manager"],
    values: values({
      employees: null, branches: null, sites: null, admins: null, history: null,
      mobile: true, qr: true, fraud: true, behalf: true, polygon: true,
      leave: true, schedules: true, scopedRoles: true, reports: true, payroll: true, api: true,
      twoFactor: true, audit: true, sso: true, retention: true,
      support: true, priority: true, manager: true,
    }),
  },
];

/** Length of the free trial every new company gets on the plan it picks. */
export const TRIAL_DAYS = 30;

export const SEED_SUBSCRIPTION: Subscription = {
  planId: "business", billing: "monthly", renewsOn: "2026-11-01", trialEndsOn: null, seatsUsed: 84,
};
