import {
  BarChart3, CalendarCheck, CalendarDays, Clock, LayoutDashboard, MapPin, Radio, ScrollText, ShieldAlert, ShieldCheck, SlidersHorizontal, Users,
  type LucideIcon,
} from "lucide-react";
import type { AdminPage } from "@/types/auth";

export interface NavItem {
  page: AdminPage;
  icon: LucideIcon;
  /** Which live counter (if any) shows as a badge on the item. */
  badge?: "alerts" | "leave";
}
export interface NavGroup {
  /** Key under `Shell.groups`. */
  group: "monitor" | "manage" | "admin";
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    group: "monitor",
    items: [
      { page: "dashboard", icon: LayoutDashboard },
      { page: "live", icon: Radio },
      { page: "attendance", icon: Clock },
      { page: "alerts", icon: ShieldAlert, badge: "alerts" },
    ],
  },
  {
    group: "manage",
    items: [
      { page: "employees", icon: Users },
      { page: "sites", icon: MapPin },
      { page: "schedules", icon: CalendarDays },
      { page: "leave", icon: CalendarCheck, badge: "leave" },
    ],
  },
  {
    group: "admin",
    items: [
      { page: "reports", icon: BarChart3 },
      { page: "users", icon: ShieldCheck },
      { page: "audit", icon: ScrollText },
      { page: "settings", icon: SlidersHorizontal },
    ],
  },
];
