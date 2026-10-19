"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/misc";
import { markSignedOut } from "@/lib/auth-cookie";

export const SIGNED_IN_USER = { name: "Claire Vasseur", email: "claire@batiplus.fr" };

/** Signed-in user and sign-out button for the workspace picker header. */
export function WorkspaceUser() {
  const t = useTranslations("Workspaces");
  const router = useRouter();
  return (
    <>
      <div className="h-6 w-px bg-border" />
      <div className="flex items-center gap-[9px]">
        <Avatar name={SIGNED_IN_USER.name} size={32} />
        <div className="leading-tight">
          <div className="text-[13px] font-semibold">{SIGNED_IN_USER.name}</div>
          <div className="text-[12px] text-text-3">{SIGNED_IN_USER.email}</div>
        </div>
      </div>
      <button
        onClick={() => { markSignedOut(); router.push("/sign-in"); }}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-solid border-border bg-transparent px-[11px] text-[12.5px] font-medium text-text-2 hover:bg-hover hover:text-bad"
      >
        <LogOut size={14} /> {t("signOut")}
      </button>
    </>
  );
}
