import { notFound } from 'next/navigation';
import { AdminHost } from '@/components/screen-host';
import { isAdminPage } from '@/lib/routes';

export default async function Page({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!isAdminPage(page)) notFound();
  return <AdminHost page={page} />;
}
