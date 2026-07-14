"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { deriveWeeklyStats } from "@/lib/weeklyStats";
import { formatCents } from "@/lib/currency";
import type { WeeklyStats, WeeklyStatsOrder } from "@/lib/data";
import { WeeklyBarChart } from "./WeeklyBarChart";
import { Confetti } from "./Confetti";

export function WeeklyStatsView({ initialStats }: { initialStats: WeeklyStats }) {
  const [orders, setOrders] = useState<WeeklyStatsOrder[]>(initialStats.thisWeekOrders);
  const [showConfetti, setShowConfetti] = useState(false);
  const hasCelebrated = useRef(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`weekly-stats-${initialStats.windowId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `order_window_id=eq.${initialStats.windowId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            drink_name_at_order: string;
            tip_cents: number;
            delivered_at: string | null;
          };
          setOrders((prev) =>
            prev.some((o) => o.id === row.id)
              ? prev
              : [
                  ...prev,
                  {
                    id: row.id,
                    drinkName: row.drink_name_at_order,
                    tipCents: row.tip_cents,
                    deliveredAt: row.delivered_at,
                  },
                ]
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `order_window_id=eq.${initialStats.windowId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; delivered_at: string | null };
          setOrders((prev) =>
            prev.map((o) => (o.id === row.id ? { ...o, deliveredAt: row.delivered_at } : o))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialStats.windowId]);

  const stats = useMemo(() => deriveWeeklyStats(orders), [orders]);
  const allDelivered = stats.cupsSold > 0 && stats.deliveredCount === stats.cupsSold;

  useEffect(() => {
    if (allDelivered && !hasCelebrated.current) {
      hasCelebrated.current = true;
      setShowConfetti(true);
      const timeout = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timeout);
    }
    if (!allDelivered) {
      hasCelebrated.current = false;
    }
  }, [allDelivered]);

  const progressPct =
    stats.cupsSold > 0 ? Math.round((stats.deliveredCount / stats.cupsSold) * 100) : 0;

  return (
    <main className="flex min-h-dvh flex-col items-center gap-8 bg-background px-4 py-8">
      {showConfetti && <Confetti />}

      <div className="text-center">
        <p className="font-display text-4xl font-extrabold text-amber-900">
          🎉 This Week&apos;s Celebration!
        </p>
        {allDelivered && (
          <p className="mt-2 font-display text-xl font-bold text-green-700">
            Every order delivered — great job, crew! 🎊
          </p>
        )}
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile emoji="☕" label="Cups Sold" value={String(stats.cupsSold)} />
        <StatTile
          emoji="⭐"
          label="Most Popular"
          value={stats.mostPopularDrink ?? "—"}
          small
        />
        <StatTile emoji="💛" label="Tips Earned" value={formatCents(stats.tipsCentsThisWeek)} />
      </div>

      <div className="w-full max-w-3xl rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-display text-lg font-bold text-amber-900">Delivered so far</p>
          <p className="font-display text-lg font-bold text-orange-600">
            {stats.deliveredCount} / {stats.cupsSold}
          </p>
        </div>
        <div className="h-6 w-full overflow-hidden rounded-full bg-amber-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-green-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-3xl rounded-3xl bg-white p-5 shadow-sm">
        <p className="mb-4 font-display text-lg font-bold text-amber-900">Cups Sold Per Week</p>
        <WeeklyBarChart data={initialStats.weeklyHistory} currentWeekStart={initialStats.weekStart} />
      </div>
    </main>
  );
}

function StatTile({
  emoji,
  label,
  value,
  small,
}: {
  emoji: string;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-3xl bg-white p-6 text-center shadow-sm">
      <span className="text-4xl">{emoji}</span>
      <p
        className={`font-display font-extrabold text-amber-900 ${small ? "text-xl" : "text-3xl"}`}
      >
        {value}
      </p>
      <p className="text-sm font-medium text-amber-600">{label}</p>
    </div>
  );
}
