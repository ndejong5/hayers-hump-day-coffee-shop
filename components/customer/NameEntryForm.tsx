"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

export function NameEntryForm({
  onSubmit,
}: {
  onSubmit: (name: string, room: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name");
      return;
    }
    setError(null);
    startTransition(async () => {
      await onSubmit(trimmed, room.trim());
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <p className="text-center text-amber-800">What&apos;s your name?</p>
      <div>
        <label className="mb-1 block text-sm font-medium text-amber-900">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sam"
          className="w-full rounded-xl border-2 border-amber-200 px-4 py-3 text-lg focus:border-amber-500 focus:outline-none"
          autoFocus
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-amber-900">
          Room number (optional)
        </label>
        <input
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="e.g. 204"
          className="w-full rounded-xl border-2 border-amber-200 px-4 py-3 text-lg focus:border-amber-500 focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Continue"}
      </Button>
    </form>
  );
}
