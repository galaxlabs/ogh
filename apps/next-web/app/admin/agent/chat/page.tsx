import type { Metadata } from "next";
import { AgentChat } from "@/components/cms/agent-chat";

export const metadata: Metadata = {
  title: "Agent Chat",
  robots: { index: false, follow: false },
};

export default function AgentChatPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Agent chat</h1>
        <p className="mt-1 text-sm text-slate-400">
          Give the agent a piece of content. It plans the articles that come next, files them under
          the right category and publishes them on a schedule.
        </p>
      </header>
      <AgentChat />
    </main>
  );
}
