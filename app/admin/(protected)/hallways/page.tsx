import { getHallways } from "@/lib/data";
import { HallwaysManager } from "@/components/admin/HallwaysManager";

export const dynamic = "force-dynamic";

export default async function HallwaysPage() {
  const hallways = await getHallways();
  return <HallwaysManager hallways={hallways} />;
}
