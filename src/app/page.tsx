import type { Metadata } from "next";
import { MainMenu } from "@/components/game/MainMenu";

export const metadata: Metadata = { title: "Ocean Empire 3D" };

export default function HomePage() {
  return <MainMenu />;
}
