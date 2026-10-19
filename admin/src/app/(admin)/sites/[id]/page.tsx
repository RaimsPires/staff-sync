import { PageGuard } from "@/components/layout/page-guard";
import { SiteDetailScreen } from "@/features/sites/site-detail";

export default async function SitePage({ params }: PageProps<"/sites/[id]">) {
  const { id } = await params;
  return (
    <PageGuard page="sites">
      <SiteDetailScreen id={id} />
    </PageGuard>
  );
}
