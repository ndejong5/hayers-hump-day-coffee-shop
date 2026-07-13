import type { WindowStatusRow } from "@/lib/types";

export function StatusBanner({ status }: { status: WindowStatusRow }) {
  if (status.status === "open") {
    return (
      <div className="w-full max-w-sm rounded-2xl bg-green-100 px-4 py-3 text-center text-green-900">
        <p className="font-semibold">Ordering is open!</p>
        <p className="text-sm">
          {status.slots_remaining} of {status.cap} slots left this week
        </p>
      </div>
    );
  }

  if (status.status === "closed_cap") {
    return (
      <div className="w-full max-w-sm rounded-2xl bg-red-100 px-4 py-3 text-center text-red-900">
        <p className="font-semibold">Ordering is full for this week</p>
        <p className="text-sm">Check back next Monday!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-red-100 px-4 py-3 text-center text-red-900">
      <p className="font-semibold">Ordering isn&apos;t open right now</p>
      <p className="text-sm">Check back soon!</p>
    </div>
  );
}
