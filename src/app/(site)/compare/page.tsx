import type { Metadata } from "next";
import { CompareView } from "@/components/compare/compare-view";

export const metadata: Metadata = {
  title: "Comparar produtos",
  description: "Compare preços, volumes, notas olfativas e avaliações de perfumes lado a lado.",
};

export default function ComparePage() {
  return <CompareView />;
}
