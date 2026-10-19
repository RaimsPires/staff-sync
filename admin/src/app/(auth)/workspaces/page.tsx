import { getTranslations } from "next-intl/server";
import { AuthHeader } from "@/features/auth/auth-header";
import { WorkspaceUser } from "@/features/auth/workspace-user";
import { WorkspacesScreen } from "@/features/auth/workspaces-screen";
import { listWorkspaces } from "@/services/workspaces";

export async function generateMetadata() {
  const t = await getTranslations("Workspaces");
  return { title: t("title") };
}

export default async function WorkspacesPage() {
  const workspaces = await listWorkspaces();
  return (
    <div className="flex min-h-screen flex-col bg-bg text-[14px] leading-[1.45] text-text">
      <AuthHeader bordered>
        <WorkspaceUser />
      </AuthHeader>
      <WorkspacesScreen workspaces={workspaces} />
    </div>
  );
}
