import { useTranslations } from "next-intl";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AuthToolbar } from "./auth-toolbar";

/** Logo + theme/language controls shown above Invite, Workspaces and Onboarding. Children go after the controls. */
export function AuthHeader({ bordered = false, children }: { bordered?: boolean; children?: React.ReactNode }) {
  const t = useTranslations("Auth");
  return (
    <header className={cn("flex items-center justify-between gap-3 px-7 py-5", bordered && "border-b border-border bg-surface py-4")}>
      <div className="flex items-center gap-[9px]">
        <div className="grid size-[30px] place-items-center overflow-hidden rounded-lg border border-border bg-white">
          <Image src="/staffsync-logo.png" alt="" width={26} height={26} className="object-contain" />
        </div>
        <span className="text-[15px] font-bold">{t("brand")}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <AuthToolbar />
        {children}
      </div>
    </header>
  );
}
