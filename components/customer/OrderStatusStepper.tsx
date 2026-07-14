const STEPS = [
  { icon: "📥", label: "Received" },
  { icon: "👩‍🍳", label: "Being made" },
  { icon: "🚶", label: "Out for delivery!" },
];

export function OrderStatusStepper({
  madeAt,
  deliveredAt,
}: {
  madeAt: string | null;
  deliveredAt: string | null;
}) {
  const activeIndex = deliveredAt ? 2 : madeAt ? 1 : 0;

  return (
    <div className="flex w-full items-start">
      {STEPS.map((step, i) => (
        <div key={step.label} className="flex flex-1 flex-col items-center">
          <div className="flex w-full items-center">
            <div
              className={`h-1 flex-1 rounded-full ${
                i === 0 ? "invisible" : i <= activeIndex ? "bg-orange-500" : "bg-amber-200"
              }`}
            />
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg transition ${
                i <= activeIndex ? "bg-orange-500 text-white" : "bg-amber-100 text-amber-400"
              }`}
            >
              {step.icon}
            </div>
            <div
              className={`h-1 flex-1 rounded-full ${
                i === STEPS.length - 1
                  ? "invisible"
                  : i < activeIndex
                    ? "bg-orange-500"
                    : "bg-amber-200"
              }`}
            />
          </div>
          <p
            className={`mt-1 text-center text-xs font-semibold ${
              i <= activeIndex ? "text-orange-700" : "text-amber-400"
            }`}
          >
            {step.label}
          </p>
        </div>
      ))}
    </div>
  );
}
