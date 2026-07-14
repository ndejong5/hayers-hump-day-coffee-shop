"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAdmin } from "@/app/admin/actions";

const links = [
  { href: "/admin/board", label: "Board", icon: "☕" },
  { href: "/admin/stats", label: "Stats", icon: "🎉" },
  { href: "/admin/menu", label: "Menu", icon: "📋" },
  { href: "/admin/window", label: "Window", icon: "🪟" },
  { href: "/admin/tabs", label: "Tabs", icon: "🧾" },
  { href: "/admin/rewards", label: "Rewards", icon: "🎁" },
  { href: "/admin/customers", label: "Customers", icon: "🙂" },
  { href: "/admin/hallways", label: "Hallways", icon: "🚪" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logoutAdmin();
    router.push("/admin/login");
  }

  return (
    <nav className="flex items-center justify-between gap-3 border-b border-amber-200 bg-white px-4 py-2">
      <div className="flex gap-2 overflow-x-auto">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-bold transition ${
                active ? "bg-orange-100 text-orange-700" : "text-amber-500"
              }`}
            >
              {link.icon} {link.label}
            </Link>
          );
        })}
      </div>
      <button
        onClick={handleLogout}
        className="shrink-0 whitespace-nowrap text-sm font-medium text-amber-700 underline"
      >
        Log out
      </button>
    </nav>
  );
}
