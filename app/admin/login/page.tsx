import Link from "next/link";
import { PinLoginForm } from "@/components/admin/PinLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-background">
      <div className="w-full bg-gradient-to-br from-orange-400 via-orange-500 to-amber-700 px-6 pb-8 pt-10 text-center shadow-md">
        <p className="font-display text-3xl font-extrabold text-white drop-shadow-sm">
          👩‍🍳 Barista Login
        </p>
        <p className="mt-1 text-sm font-medium text-orange-50">Enter your PIN to get started</p>
      </div>

      <div className="flex w-full flex-1 flex-col items-center gap-6 px-4 py-8">
        <PinLoginForm />
        <Link href="/" className="text-sm font-medium text-orange-600 underline">
          ← Back to menu
        </Link>
      </div>
    </main>
  );
}
