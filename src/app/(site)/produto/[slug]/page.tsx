import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import { getProductBySlug, getRelatedProducts } from "@/server/services/catalog/queries";
import { getStoreSettings } from "@/server/services/settings/store-settings";

// No generateStaticParams: the catalogue is read from the database and can
// change between deploys, so product pages render on demand rather than being
// baked in at build time.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription,
    openGraph: {
      title: product.seoTitle ?? product.name,
      description: product.seoDescription ?? product.shortDescription,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getStoreSettings()]);
  if (!product) notFound();

  const related = await getRelatedProducts(product);

  // TODO(task 22/24): real reviews, tied to verified orders.
  return (
    <ProductDetail
      product={product}
      reviews={[]}
      related={related}
      shippingPolicy={{ handlingDays: settings.handlingDays, shipmentPolicy: settings.shipmentPolicy }}
    />
  );
}
