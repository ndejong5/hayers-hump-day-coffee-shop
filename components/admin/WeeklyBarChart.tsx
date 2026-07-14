const CHART_HEIGHT = 160;
const BAR_COLOR = "#ea7317";
const CURRENT_BAR_COLOR = "#c2410c";

export function WeeklyBarChart({
  data,
  currentWeekStart,
}: {
  data: { weekStart: string; cupsSold: number }[];
  currentWeekStart: string;
}) {
  if (data.length === 0) {
    return <p className="text-center text-amber-700">No weeks yet — check back after Monday!</p>;
  }

  const max = Math.max(...data.map((d) => d.cupsSold), 1);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-full items-end gap-3 px-2" style={{ height: CHART_HEIGHT + 48 }}>
        {data.map((d) => {
          const isCurrent = d.weekStart === currentWeekStart;
          const barHeight = Math.max((d.cupsSold / max) * CHART_HEIGHT, d.cupsSold > 0 ? 6 : 2);
          const label = new Date(`${d.weekStart}T00:00:00`).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
          return (
            <div key={d.weekStart} className="flex min-w-[52px] flex-1 flex-col items-center gap-1">
              <span className="font-display text-sm font-bold text-amber-900">{d.cupsSold}</span>
              <div
                className="w-full rounded-t-xl"
                style={{
                  height: barHeight,
                  backgroundColor: isCurrent ? CURRENT_BAR_COLOR : BAR_COLOR,
                }}
              />
              <span className="text-xs text-amber-600">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
