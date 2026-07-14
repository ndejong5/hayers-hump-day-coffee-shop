import { getWindowStatus, getBoardOrders, getHallways } from "@/lib/data";
import { DeliveryRunSheet } from "@/components/admin/DeliveryRunSheet";

export const dynamic = "force-dynamic";

export default async function DeliveryPage() {
  const windowStatus = await getWindowStatus();
  const [orders, hallways] = await Promise.all([
    getBoardOrders(windowStatus.id),
    getHallways(),
  ]);
  const pending = orders.filter((o) => o.made_at && !o.delivered_at);

  return (
    <DeliveryRunSheet initialOrders={pending} hallways={hallways} windowId={windowStatus.id} />
  );
}
