import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "w-full rounded-2xl px-6 py-4 text-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]";
  const variants: Record<Variant, string> = {
    primary: "bg-amber-600 text-white hover:bg-amber-700",
    secondary: "bg-amber-100 text-amber-900 hover:bg-amber-200",
    outline: "border-2 border-amber-300 text-amber-900 hover:bg-amber-50",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
