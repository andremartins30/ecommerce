import { ProductForm } from "@/components/admin/product-form";
import { getProductFormOptions } from "@/server/services/admin/product-queries";

export default async function NewProductPage() {
  const options = await getProductFormOptions();
  return <ProductForm options={options} />;
}
