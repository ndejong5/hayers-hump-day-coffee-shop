import { getWindowStatus, getBoardOrders } from "@/lib/data";
import { LabelSheet } from "@/components/admin/LabelSheet";

export const dynamic = "force-dynamic";

export default async function LabelsPage() {
  const windowStatus = await getWindowStatus();
  const orders = await getBoardOrders(windowStatus.id);
  return <LabelSheet orders={orders} />;
}
