import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { AdminDashboard } from "@/components/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin",
  description: "Restricted internal operations page.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <SiteShell>
      <main className="flex-1 bg-muted/20 py-12">
        <AdminDashboard />
      </main>
    </SiteShell>
  );
}
