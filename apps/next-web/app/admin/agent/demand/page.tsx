import type { Metadata } from "next";
import { DemandPanel } from "@/components/cms/demand-panel";

export const metadata: Metadata = {
  title: "Demand Miner",
  robots: { index: false, follow: false },
};

export default function DemandPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Demand miner</h1>
        <p className="mt-1 text-sm text-slate-400">
          Find the questions people are asking on forums and technical communities, score them by
          real demand, and turn every solved one into a full article of our own.
        </p>
      </header>
      <DemandPanel />
    </main>
  );
}
