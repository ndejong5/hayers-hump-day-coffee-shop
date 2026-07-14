import type { Hallway } from "@/lib/types";

export function parseRoomNumber(room: string | null): number | null {
  if (!room) return null;
  const match = room.match(/\d+/);
  if (!match) return null;
  return parseInt(match[0], 10);
}

export function matchHallway(room: string | null, hallways: Hallway[]): Hallway | null {
  const normalizedRoom = room?.trim().toLowerCase() ?? "";
  const roomNumber = parseRoomNumber(room);

  const sorted = [...hallways].sort((a, b) => a.sort_order - b.sort_order);
  for (const hallway of sorted) {
    for (const rule of hallway.rules) {
      if (rule.kind === "exact") {
        if (rule.exact_value && rule.exact_value.trim().toLowerCase() === normalizedRoom) {
          return hallway;
        }
      } else if (rule.kind === "range") {
        if (
          roomNumber !== null &&
          rule.range_min !== null &&
          rule.range_max !== null &&
          roomNumber >= rule.range_min &&
          roomNumber <= rule.range_max
        ) {
          return hallway;
        }
      }
    }
  }
  return null;
}

export function groupByHallway<T extends { room: string | null }>(
  items: T[],
  hallways: Hallway[]
): { hallway: Hallway | null; items: T[] }[] {
  const sortedHallways = [...hallways].sort((a, b) => a.sort_order - b.sort_order);
  const buckets = new Map<string, T[]>();
  const unassigned: T[] = [];

  for (const item of items) {
    const hallway = matchHallway(item.room, hallways);
    if (!hallway) {
      unassigned.push(item);
      continue;
    }
    const list = buckets.get(hallway.id) ?? [];
    list.push(item);
    buckets.set(hallway.id, list);
  }

  function sortWithinHallway(list: T[]): T[] {
    return [...list].sort((a, b) => {
      const numA = parseRoomNumber(a.room);
      const numB = parseRoomNumber(b.room);
      if (numA !== null && numB !== null) return numA - numB;
      if (numA !== null) return -1;
      if (numB !== null) return 1;
      return (a.room ?? "").localeCompare(b.room ?? "");
    });
  }

  const groups: { hallway: Hallway | null; items: T[] }[] = sortedHallways
    .filter((h) => buckets.has(h.id))
    .map((hallway) => ({ hallway, items: sortWithinHallway(buckets.get(hallway.id)!) }));

  if (unassigned.length > 0) {
    groups.push({ hallway: null, items: sortWithinHallway(unassigned) });
  }

  return groups;
}
