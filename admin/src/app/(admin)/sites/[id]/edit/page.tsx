import { PageGuard } from "@/components/layout/page-guard";
import { SiteEditor } from "@/features/sites/site-editor";

export default async function EditSitePage({ params }: PageProps<"/sites/[id]/edit">) {
  const { id } = await params;
  return (
    <PageGuard page="sites">
      <SiteEditor siteId={id} />
    </PageGuard>
  );
}
