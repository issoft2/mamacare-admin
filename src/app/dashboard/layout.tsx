/**
 * admin/src/app/dashboard/layout.tsx
 * Dashboard layout with sidebar.
 */

import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen min-w-0">
      <Sidebar />
      <main className="flex-1 min-h-0 min-w-0 overflow-auto bg-gray-50">{children}</main>
    </div>
  );
}
