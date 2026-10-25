"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useUsers } from "@/store/users";
import { RoleEditor, type EditorMode } from "./role-editor";

const BACK = "/users?tab=roles";

/** The role editor on its own URL: `/users/roles/new`, `/users/roles/[id]` and `?mode=duplicate`. */
export function RoleEditorScreen({ id, duplicate }: { id: string | null; duplicate: boolean }) {
  const t = useTranslations("Users");
  const router = useRouter();
  const toast = useToast();
  const { roles, saveRole } = useUsers();
  const role = id ? roles.find((r) => r.id === id) ?? null : null;
  if (id && !role) {
    return <EmptyState title={t("editor.notFound")} action={<Link href={BACK}>{t("editor.back")}</Link>} />;
  }
  const mode: EditorMode = !role ? "create" : duplicate ? "duplicate" : role.builtIn ? "view" : "edit";
  return (
    <RoleEditor
      key={`${mode}-${role?.id ?? "new"}`}
      role={role}
      mode={mode}
      onCancel={() => router.push(BACK)}
      onDuplicate={() => router.push(`/users/roles/${role?.id}?mode=duplicate`)}
      onSave={async (draft) => {
        try {
          await saveRole(draft);
        } catch (e) {
          return toast(e instanceof Error ? e.message : t("toasts.failed"), "bad");
        }
        toast(t(draft.id ? "toasts.roleUpdated" : "toasts.roleCreated"));
        router.push(BACK);
      }}
    />
  );
}
