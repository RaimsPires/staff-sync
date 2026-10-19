import { PageGuard } from "@/components/layout/page-guard";
import { RoleEditorScreen } from "@/features/users/role-editor-screen";

export default function NewRolePage() {
  return (
    <PageGuard page="users">
      <RoleEditorScreen id={null} duplicate={false} />
    </PageGuard>
  );
}
