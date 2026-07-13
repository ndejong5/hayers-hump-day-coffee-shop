const COLORS = ["#ea7317", "#c2410c", "#b45309", "#166534", "#0e7490", "#6d28d9", "#be185d"];

export function CustomerAvatar({
  name,
  photoUrl,
  className = "",
  textClassName = "text-2xl",
}: {
  name: string;
  photoUrl?: string | null;
  className?: string;
  textClassName?: string;
}) {
  if (photoUrl) {
    return (
      <div className={`overflow-hidden rounded-2xl ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded photos of arbitrary origin */}
        <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const color = COLORS[name.charCodeAt(0) % COLORS.length];

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-2xl font-display font-bold text-white ${textClassName} ${className}`}
      style={{ backgroundColor: color }}
    >
      {initial}
    </div>
  );
}
