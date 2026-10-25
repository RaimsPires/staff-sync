"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/misc";
import { signOut } from "@/services/auth";
import { useAuth } from "@/store/auth";

/** Signed-in user and sign-out button for the workspace picker header. */
export function WorkspaceUser() {
  const t = useTranslations("Workspaces");
  const router = useRouter();
  const me = useAuth((s) => s.me);
  if (!me) return null;
  return (
    <>
      <div className="h-6 w-px bg-border" />
      <div className="flex items-center gap-[9px]">
        <Avatar name={me.full_name} size={32} />
        <div className="leading-tight">
          <div className="text-[13px] font-semibold">{me.full_name}</div>
          <div className="text-[12px] text-text-3">{me.email ?? me.phone ?? ""}</div>
        </div>
      </div>
      <button
        onClick={() => { void signOut().then(() => router.push("/sign-in")); }}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-solid border-border bg-transparent px-[11px] text-[12.5px] font-medium text-text-2 hover:bg-hover hover:text-bad"
      >
        <LogOut size={14} /> {t("signOut")}
      </button>
    </>
  );
}
