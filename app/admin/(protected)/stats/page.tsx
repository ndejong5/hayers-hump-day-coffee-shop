import { getWeeklyStats } from "@/lib/data";
import { WeeklyStatsView } from "@/components/admin/WeeklyStatsView";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const stats = await getWeeklyStats();
  return <WeeklyStatsView initialStats={stats} />;
}
