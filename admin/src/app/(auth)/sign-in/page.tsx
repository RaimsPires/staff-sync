import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { AuthToolbar } from "@/features/auth/auth-toolbar";
import { BrandPanel } from "@/features/auth/brand-panel";
import { SignInForm, type PreviewState } from "@/features/auth/sign-in-form";

const PREVIEWS: readonly PreviewState[] = ["default", "loading", "wrong", "locked", "deactivated", "offline"];

export async function generateMetadata() {
  const t = await getTranslations("Auth");
  return { title: t("signIn") };
}

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const [t, params] = await Promise.all([getTranslations("Auth"), searchParams]);
  const state = Array.isArray(params.state) ? params.state[0] : params.state;
  const previewState = PREVIEWS.find((p) => p === state) ?? "default";

  return (
    <div className="flex min-h-screen bg-surface text-[14px] leading-[1.45] text-text">
      <BrandPanel />
      <section className="box-border flex min-h-screen flex-[1_1_50%] flex-col bg-surface px-8 py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 lg:invisible">
            <Image src="/staffsync-logo.png" alt="" width={30} height={30} className="object-contain" />
            <span className="text-[16px] font-bold">{t("brand")}</span>
          </div>
          <AuthToolbar />
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[400px]">
            <SignInForm key={previewState} previewState={previewState} />
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-2 text-[12px] text-text-3">
          <span>{t("footer.copyright")}</span>
          <div className="flex gap-4">
            <a href="#" className="text-text-3">{t("footer.privacy")}</a>
            <a href="#" className="text-text-3">{t("footer.terms")}</a>
            <a href="#" className="text-text-3">{t("footer.status")}</a>
          </div>
        </div>
      </section>
    </div>
  );
}
