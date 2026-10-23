import type { Metadata } from "next";
import { Suspense } from "react";
import { NewGameWizard } from "@/components/game/NewGameWizard";

export const metadata: Metadata = { title: "New Game" };

export default function NewGamePage() {
  return (
    <Suspense fallback={null}>
      <NewGameWizard />
    </Suspense>
  );
}
