"use client";

import { Suspense } from "react";
import { TradeScreen } from "@/components/game/TradeScreen";

export default function TradePage() {
  return (
    <Suspense fallback={null}>
      <TradeScreen />
    </Suspense>
  );
}
