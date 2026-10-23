import { GameShell } from "@/components/game/GameShell";

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <GameShell>{children}</GameShell>;
}
