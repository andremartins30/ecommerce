import { InventoryTable } from "@/components/admin/inventory-table";
import { listInventoryForAdmin } from "@/server/services/admin/inventory-queries";

export default async function AdminInventoryPage() {
  const items = await listInventoryForAdmin();
  return <InventoryTable items={items} />;
}
