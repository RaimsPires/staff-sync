import { getTranslations } from "next-intl/server";
import { AuthHeader } from "@/features/auth/auth-header";
import { InviteScreen, type InviteState } from "@/features/auth/invite-screen";

const STATES: readonly InviteState[] = ["valid", "expired", "used"];

export async function generateMetadata() {
  const t = await getTranslations("Invite");
  return { title: t("title") };
}

export default async function InvitePage({ searchParams }: PageProps<"/invite">) {
  const params = await searchParams;
  const raw = Array.isArray(params.state) ? params.state[0] : params.state;
  const state = STATES.find((s) => s === raw) ?? "valid";

  return (
    <div className="flex min-h-screen flex-col bg-bg text-[14px] leading-[1.45] text-text">
      <AuthHeader />
      <main className="flex flex-1 items-start justify-center px-5 pb-14 pt-4">
        <div className={`w-full animate-rise ${state === "valid" ? "max-w-[860px]" : "max-w-[520px]"}`}>
          <InviteScreen state={state} />
        </div>
      </main>
    </div>
  );
}
