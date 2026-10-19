import { PageGuard } from "@/components/layout/page-guard";
import { SiteEditor } from "@/features/sites/site-editor";

export default function NewSitePage() {
  return (
    <PageGuard page="sites">
      <SiteEditor siteId={null} />
    </PageGuard>
  );
}
