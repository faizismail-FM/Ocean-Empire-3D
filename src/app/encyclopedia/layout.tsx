import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { ENCYCLOPEDIA_TYPES } from "@/lib/encyclopedia";

export default function EncyclopediaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-navy-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-8">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-foam/60 hover:text-foam"><ArrowLeft size={14} /> Menu</Link>
          <Link href="/encyclopedia" className="flex items-center gap-2 text-lg"><BookOpen size={18} className="text-gold-300" /> Civilization Encyclopedia</Link>
          <Link href="/play/world" className="ml-auto text-sm text-cyan-300 hover:underline">Back to game</Link>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 md:px-8" aria-label="Encyclopedia sections">
          <Link href="/encyclopedia/maps" className="whitespace-nowrap rounded-md px-2.5 py-1 text-xs text-foam/70 hover:bg-white/5 hover:text-foam">Historical maps</Link>
          {ENCYCLOPEDIA_TYPES.map((t) => (
            <Link key={t.id} href={`/encyclopedia/${t.id}`} className="whitespace-nowrap rounded-md px-2.5 py-1 text-xs text-foam/70 hover:bg-white/5 hover:text-foam">
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
