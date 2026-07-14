export function groupModifierNames(modifiers: { name: string }[]): string[] {
  const counts = new Map<string, number>();
  for (const m of modifiers) counts.set(m.name, (counts.get(m.name) ?? 0) + 1);
  return Array.from(counts.entries()).map(([name, count]) =>
    count > 1 ? `${name} ×${count}` : name
  );
}
