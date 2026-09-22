import type { Metadata } from "next";
import { CompareView } from "@/components/compare/compare-view";

export const metadata: Metadata = {
  title: "Compare Products — NEBULA",
  description: "Compare features, pricing, materials, and reviews of NEBULA products side by side.",
};

export default function ComparePage() {
  return <CompareView />;
}
