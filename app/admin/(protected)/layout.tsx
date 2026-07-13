import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  return (
    <div className="min-h-dvh bg-amber-50">
      <AdminNav />
      {children}
    </div>
  );
}
