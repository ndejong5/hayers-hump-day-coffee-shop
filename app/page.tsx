import { getMenu, getWindowStatus, getPublicSettings } from "@/lib/data";
import { OrderFlow } from "@/components/customer/OrderFlow";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ drinks, modifiers }, windowStatus, settings] = await Promise.all([
    getMenu(),
    getWindowStatus(),
    getPublicSettings(),
  ]);

  return (
    <OrderFlow
      drinks={drinks}
      modifiers={modifiers}
      windowStatus={windowStatus}
      settings={settings}
    />
  );
}
