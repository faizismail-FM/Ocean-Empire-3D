import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpenText } from "lucide-react";
import { GuidePageContent } from "./GuidePageContent";

export const metadata: Metadata = { title: "How to play" };

export default function GuidePage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-navy-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-8">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-foam/60 hover:text-foam">
            <ArrowLeft size={14} /> Menu
          </Link>
          <span className="flex items-center gap-2 text-lg">
            <BookOpenText size={18} className="text-gold-300" /> How to play
          </span>
          <Link href="/play/world" className="ml-auto text-sm text-cyan-300 hover:underline">
            Back to game
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <h1 className="text-4xl">Player guide</h1>
        <p className="mt-2 max-w-3xl text-foam/70">Everything you need to run a shipping company in Ocean Empire 3D, from the first delivery to port development. Each in-game screen also has a small ? button that opens the matching section.</p>
        <div className="mt-8">
          <GuidePageContent />
        </div>
      </main>
    </div>
  );
}
