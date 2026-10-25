import { create } from "zustand";

export interface CompanyBrief {
  id: string;
  name: string;
  initials: string;
  color: string;
  /** Backend brief role: employee | site_manager | admin. */
  role: string;
}

/** `GET /me`: the signed-in user in the selected company. */
export interface Me {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  locale: string;
  theme: string;
  totp_enabled: boolean;
  notification_prefs: Record<string, [boolean, boolean, boolean]> | null;
  company_id: string | null;
  companies: CompanyBrief[];
  roles: string[];
  permissions: string[];
  scope: { all: boolean; site_ids: string[] | null; branch_ids: string[] | null; self_only: boolean };
  employee_id: string | null;
}

interface AuthState {
  me: Me | null;
  setMe: (me: Me | null) => void;
}

/** In-memory only: the access token lives in the API client and the session is restored from the refresh cookie. */
export const useAuth = create<AuthState>()((set) => ({
  me: null,
  setMe: (me) => set({ me }),
}));
