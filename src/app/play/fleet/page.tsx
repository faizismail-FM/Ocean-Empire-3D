"use client";

import { Suspense } from "react";
import { FleetScreen } from "@/components/game/FleetScreen";

export default function FleetPage() {
  return (
    <Suspense fallback={null}>
      <FleetScreen />
    </Suspense>
  );
}
