import { PageGuard } from "@/components/layout/page-guard";
import { EmployeeProfileScreen } from "@/features/employees/profile/profile-screen";

export default async function EmployeeProfilePage({ params }: PageProps<"/employees/[id]">) {
  const { id } = await params;
  return (
    <PageGuard page="employees">
      <EmployeeProfileScreen id={decodeURIComponent(id)} />
    </PageGuard>
  );
}
