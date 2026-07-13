import { getCustomersWithPunches, getPublicSettings } from "@/lib/data";
import { RewardsManager } from "@/components/admin/RewardsManager";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const [customers, settings] = await Promise.all([
    getCustomersWithPunches(),
    getPublicSettings(),
  ]);

  return <RewardsManager customers={customers} settings={settings} />;
}
