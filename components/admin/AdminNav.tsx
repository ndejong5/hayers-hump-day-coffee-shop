"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAdmin } from "@/app/admin/actions";

const links = [
  { href: "/admin/board", label: "Board" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/window", label: "Window" },
  { href: "/admin/tabs", label: "Tabs" },
  { href: "/admin/rewards", label: "Rewards" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logoutAdmin();
    router.push("/admin/login");
  }

  return (
    <nav className="flex items-center justify-between border-b border-amber-200 bg-white px-4 py-3">
      <div className="flex gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-semibold ${
              pathname.startsWith(link.href) ? "text-amber-900" : "text-amber-500"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <button onClick={handleLogout} className="text-sm text-amber-700 underline">
        Log out
      </button>
    </nav>
  );
}
