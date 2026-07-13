import { notFound } from "next/navigation";
import { getCustomerTabDetail, getPublicSettings } from "@/lib/data";
import { TabDetail } from "@/components/admin/TabDetail";

export const dynamic = "force-dynamic";

export default async function TabDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const [detail, settings] = await Promise.all([
    getCustomerTabDetail(customerId),
    getPublicSettings(),
  ]);
  if (!detail) notFound();

  return <TabDetail detail={detail} settings={settings} />;
}
