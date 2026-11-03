import type { Metadata } from "next";
import { AgentPanel } from "@/components/cms/agent-panel";

export const metadata: Metadata = {
  title: "Content Agent",
  robots: { index: false, follow: false },
};

export default function AgentPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Content agent</h1>
        <p className="mt-1 text-sm text-slate-400">
          Write and blast search-optimised articles into the right category, with brand voice,
          keywords and FAQ support.
        </p>
      </header>
      <AgentPanel />
    </main>
  );
}
