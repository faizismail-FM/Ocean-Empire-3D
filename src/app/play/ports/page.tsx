"use client";

import { Suspense } from "react";
import { PortsScreen } from "@/components/game/PortsScreen";

export default function PortsPage() {
  return (
    <Suspense fallback={null}>
      <PortsScreen />
    </Suspense>
  );
}
