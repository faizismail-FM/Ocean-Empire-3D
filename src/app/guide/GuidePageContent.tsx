"use client";

import { useSyncExternalStore } from "react";
import { GUIDE, type GuideSectionId } from "@/content/guide";
import { GuideContent } from "@/components/game/Guide";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function readHash(): GuideSectionId | undefined {
  const id = window.location.hash.replace(/^#guide-/, "");
  return GUIDE.some((s) => s.id === id) ? (id as GuideSectionId) : undefined;
}

/** Client wrapper so the guide can open on the section named in the URL hash. */
export function GuidePageContent() {
  const initial = useSyncExternalStore(subscribe, readHash, () => undefined);
  return <GuideContent sections={GUIDE} initial={initial} />;
}
