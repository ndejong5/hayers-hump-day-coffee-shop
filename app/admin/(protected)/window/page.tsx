import { getWindowStatus } from "@/lib/data";
import { WindowManager } from "@/components/admin/WindowManager";

export const dynamic = "force-dynamic";

export default async function WindowPage() {
  const windowStatus = await getWindowStatus();

  return <WindowManager windowStatus={windowStatus} />;
}
