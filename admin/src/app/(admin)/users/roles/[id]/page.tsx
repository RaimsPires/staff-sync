import { PageGuard } from "@/components/layout/page-guard";
import { RoleEditorScreen } from "@/features/users/role-editor-screen";

export default async function RolePage({ params, searchParams }: PageProps<"/users/roles/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return (
    <PageGuard page="users">
      <RoleEditorScreen id={decodeURIComponent(id)} duplicate={query.mode === "duplicate"} />
    </PageGuard>
  );
}
