import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/admin-shell";
import { isAdminAuthenticated } from "@/lib/admin-auth";

/**
 * Definitive server-side guard for every /admin/* page except the login route.
 * A server component check is the recommended place for real authorization in
 * the App Router — pages in this group never render without a valid session.
 */
export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
