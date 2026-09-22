import { AccountOverviewClient } from "./account-overview-client";
import { RecommendedProducts } from "@/components/account/recommended-products";

export default function AccountOverviewPage() {
  return <AccountOverviewClient recommended={<RecommendedProducts />} />;
}
