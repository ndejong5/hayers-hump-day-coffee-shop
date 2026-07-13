import { getBoardOrders, getWindowStatus } from "@/lib/data";
import { OrderBoard } from "@/components/admin/OrderBoard";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const windowStatus = await getWindowStatus();
  const orders = await getBoardOrders(windowStatus.id);

  return <OrderBoard initialOrders={orders} windowId={windowStatus.id} />;
}
