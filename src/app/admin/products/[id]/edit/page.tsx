import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getProductByIdForAdmin, getProductFormOptions } from "@/server/services/admin/product-queries";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, options] = await Promise.all([getProductByIdForAdmin(id), getProductFormOptions()]);

  if (!product) notFound();

  return <ProductForm key={product.id} product={product} options={options} />;
}
