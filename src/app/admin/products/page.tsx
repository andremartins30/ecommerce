import { ProductsTable } from "@/components/admin/products-table";
import { listProductsForAdmin } from "@/server/services/admin/product-queries";

export default async function AdminProductsPage() {
  const products = await listProductsForAdmin();
  const categoryNames = [...new Set(products.map((p) => p.categoryName))].sort();

  return <ProductsTable products={products} categoryNames={categoryNames} />;
}
