export function PunchCard({ punches, required }: { punches: number; required: number }) {
  const filled = Math.min(punches, required);
  const cells = Array.from({ length: required }, (_, i) => i < filled);
  const freeReady = punches >= required;

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-semibold text-amber-900">Rewards punch card</p>
        <p className="text-sm text-amber-600">
          {filled} / {required}
        </p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {cells.map((isFilled, i) => (
          <div
            key={i}
            className={`flex aspect-square items-center justify-center rounded-full border-2 text-lg ${
              isFilled ? "border-amber-500 bg-amber-100" : "border-amber-200 bg-white"
            }`}
          >
            {isFilled ? "☕" : ""}
          </div>
        ))}
      </div>
      {freeReady && (
        <p className="mt-3 text-center text-sm font-semibold text-amber-700">
          🎉 Free drink ready — redeem it on your next order!
        </p>
      )}
    </div>
  );
}
