import Link from "next/link";
import { PinLoginForm } from "@/components/admin/PinLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-amber-50 p-6">
      <h1 className="text-2xl font-bold text-amber-900">☕ Barista Login</h1>
      <PinLoginForm />
      <Link href="/" className="text-sm text-amber-600 underline">
        ← Back to menu
      </Link>
    </main>
  );
}
