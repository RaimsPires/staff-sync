import { getTranslations } from "next-intl/server";
import { AuthHeader } from "@/features/auth/auth-header";
import { InviteLoader } from "@/features/auth/invite-loader";

export async function generateMetadata() {
  const t = await getTranslations("Invite");
  return { title: t("title") };
}

export default async function InviteTokenPage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  return (
    <div className="flex min-h-screen flex-col bg-bg text-[14px] leading-[1.45] text-text">
      <AuthHeader />
      <main className="flex flex-1 items-start justify-center px-5 pb-14 pt-4">
        <div className="w-full max-w-[860px] animate-rise">
          <InviteLoader token={token} />
        </div>
      </main>
    </div>
  );
}
