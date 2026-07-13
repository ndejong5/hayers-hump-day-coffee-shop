export function buildVenmoLink(baseLink: string, amountCents: number, note: string): string {
  if (!baseLink) return "";
  const amount = (amountCents / 100).toFixed(2);
  const separator = baseLink.includes("?") ? "&" : "?";
  return `${baseLink}${separator}txn=pay&amount=${amount}&note=${encodeURIComponent(note)}`;
}

export function buildPaypalLink(baseLink: string, amountCents: number): string {
  if (!baseLink) return "";
  const amount = (amountCents / 100).toFixed(2);
  const trimmed = baseLink.replace(/\/$/, "");
  return `${trimmed}/${amount}`;
}
