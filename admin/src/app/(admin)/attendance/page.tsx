import { getTranslations } from "next-intl/server";
import { PageGuard } from "@/components/layout/page-guard";
import { AttendanceScreen, type AttendanceInitial } from "@/features/attendance/attendance-screen";

export async function generateMetadata() {
  const t = await getTranslations("Nav.pages");
  return { title: t("attendance") };
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AttendancePage({ searchParams }: PageProps<"/attendance">) {
  const params = await searchParams;
  const drawer = Number(first(params.drawer));
  const initial: AttendanceInitial = {
    status: first(params.status),
    site: first(params.site),
    date: first(params.date),
    drawer: Number.isFinite(drawer) && drawer > 0 ? drawer : undefined,
  };
  // The drawer id and filters are part of the key so a dashboard link re-initialises the screen.
  const key = JSON.stringify(initial);
  return (
    <PageGuard page="attendance">
      <AttendanceScreen key={key} initial={initial} />
    </PageGuard>
  );
}
