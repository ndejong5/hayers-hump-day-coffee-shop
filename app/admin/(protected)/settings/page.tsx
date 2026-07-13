import { getPublicSettings } from "@/lib/data";
import { PaymentLinksManager } from "@/components/admin/PaymentLinksManager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getPublicSettings();
  return <PaymentLinksManager settings={settings} />;
}
