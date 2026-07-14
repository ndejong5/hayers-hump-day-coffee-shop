import type { WeeklyStatsOrder } from "@/lib/data";

export interface DerivedWeeklyStats {
  cupsSold: number;
  deliveredCount: number;
  mostPopularDrink: string | null;
  tipsCentsThisWeek: number;
}

export function deriveWeeklyStats(orders: WeeklyStatsOrder[]): DerivedWeeklyStats {
  const deliveredCount = orders.filter((o) => o.deliveredAt).length;
  const tipsCentsThisWeek = orders.reduce((sum, o) => sum + o.tipCents, 0);

  const drinkCounts = new Map<string, number>();
  for (const o of orders) {
    drinkCounts.set(o.drinkName, (drinkCounts.get(o.drinkName) ?? 0) + 1);
  }
  let mostPopularDrink: string | null = null;
  let maxCount = 0;
  for (const [name, count] of drinkCounts) {
    if (count > maxCount) {
      maxCount = count;
      mostPopularDrink = name;
    }
  }

  return {
    cupsSold: orders.length,
    deliveredCount,
    mostPopularDrink,
    tipsCentsThisWeek,
  };
}
