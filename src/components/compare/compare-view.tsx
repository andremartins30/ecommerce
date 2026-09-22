"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeftRight, Trash2, ShoppingBag, Check, Star, Plus, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCompareStore } from "@/store/compare-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { products, trendingProducts } from "@/lib/data/products";
import { useCartStore } from "@/store/cart-store";
import { getCategoryById } from "@/lib/data/categories";

// Merge full catalog + trending items for comparison lookup
const allProducts = [...trendingProducts, ...products.filter(p => !trendingProducts.some(t => t.id === p.id))];

export function CompareView() {
  const productIds = useCompareStore((s) => s.productIds);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const addItem = useCartStore((s) => s.addItem);
  const hydrated = useHydrated();

  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const items = allProducts.filter((p) => productIds.includes(p.id));

  function handleAddToCart(product: typeof allProducts[0]) {
    const defaultVariant = product.variants[0];
    addItem(product, defaultVariant, 1);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    toast.success("Added to cart", { description: `${product.name} — $${product.price.toFixed(2)}` });
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  }

  if (!hydrated) {
    return (
      <div className="container-page py-12 sm:py-16">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-16 sm:py-24">
        <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-[#0B1A30]">
            <ArrowLeftRight className="size-8" strokeWidth={1.75} />
          </div>
          <h1 className="mt-5 font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Compare Products
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            You haven&apos;t added any products to compare yet. Browse the catalog and click the compare icon (
            <ArrowLeftRight className="inline size-3.5" />) on any product.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0B1A30] px-6 text-xs font-bold tracking-wide text-white shadow-sm transition-all hover:bg-[#122b50]"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Product Comparison
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Comparing <strong className="font-semibold text-slate-800">{items.length}</strong> of 4 products side by side.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {items.length < 4 && (
            <Link
              href="/shop"
              className="inline-flex h-9.5 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50"
            >
              <Plus className="size-3.5" />
              <span>Add More</span>
            </Link>
          )}
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-9.5 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/60 px-4 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
          >
            <Trash2 className="size-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Comparison Grid Table */}
      <div className="mt-8 overflow-x-auto pb-6">
        <div className="min-w-[700px]">
          {/* Header Row: Images, Titles, Prices, Cart */}
          <div className="grid grid-cols-[160px_repeat(auto-fit,minmax(220px,1fr))] gap-4 border-b border-slate-200 pb-6">
            <div className="flex items-center font-heading text-xs font-bold tracking-wider text-slate-400 uppercase">
              Product Overview
            </div>

            {items.map((product) => {
              const isAdded = addedIds[product.id];
              return (
                <div key={product.id} className="relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => remove(product.id, product.name)}
                    aria-label={`Remove ${product.name}`}
                    className="absolute top-2.5 right-2.5 z-10 flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>

                  <div>
                    {/* Thumbnail */}
                    <Link href={`/product/${product.slug}`} className="block">
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50">
                        <Image
                          src={product.images[0]?.url}
                          alt={product.name}
                          fill
                          sizes="240px"
                          className="object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                      <span className="mt-3 block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                        {product.brand}
                      </span>
                      <h3 className="line-clamp-2 font-heading text-sm font-bold text-slate-900 hover:text-[#0B1A30]">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Price and Rating */}
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-heading text-base font-extrabold text-slate-900">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          ${product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-slate-700">{product.rating}</span>
                      <span>({product.reviewCount})</span>
                    </div>
                  </div>

                  {/* Quick Add Button */}
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    className={`mt-4 flex h-9.5 w-full items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${
                      isAdded
                        ? "bg-emerald-600 text-white"
                        : "bg-[#0B1A30] text-white hover:bg-[#132847]"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="size-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="size-3.5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Specs Rows */}
          <div className="divide-y divide-slate-100">
            {/* Category Row */}
            <div className="grid grid-cols-[160px_repeat(auto-fit,minmax(220px,1fr))] gap-4 py-4 text-xs">
              <span className="font-semibold text-slate-500">Category</span>
              {items.map((p) => {
                const cat = getCategoryById(p.categoryId);
                return (
                  <span key={p.id} className="font-medium text-slate-800">
                    {cat?.name ?? "General Essentials"}
                  </span>
                );
              })}
            </div>

            {/* Availability */}
            <div className="grid grid-cols-[160px_repeat(auto-fit,minmax(220px,1fr))] gap-4 py-4 text-xs">
              <span className="font-semibold text-slate-500">Availability</span>
              {items.map((p) => (
                <div key={p.id}>
                  {p.stock > 0 ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      In Stock ({p.stock} units)
                    </span>
                  ) : (
                    <span className="font-semibold text-rose-500">Out of Stock</span>
                  )}
                </div>
              ))}
            </div>

            {/* Colors */}
            <div className="grid grid-cols-[160px_repeat(auto-fit,minmax(220px,1fr))] gap-4 py-4 text-xs">
              <span className="font-semibold text-slate-500">Color Options</span>
              {items.map((p) => (
                <div key={p.id} className="flex flex-wrap gap-1.5">
                  {p.colors && p.colors.length > 0 ? (
                    p.colors.map((c) => (
                      <span
                        key={c.name}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700"
                      >
                        <span
                          className="size-2 rounded-full border border-black/10"
                          style={{ backgroundColor: c.hex }}
                        />
                        {c.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
              ))}
            </div>

            {/* Sizes */}
            <div className="grid grid-cols-[160px_repeat(auto-fit,minmax(220px,1fr))] gap-4 py-4 text-xs">
              <span className="font-semibold text-slate-500">Sizes</span>
              {items.map((p) => (
                <div key={p.id} className="flex flex-wrap gap-1">
                  {p.sizes && p.sizes.length > 0 ? (
                    p.sizes.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">One Size</span>
                  )}
                </div>
              ))}
            </div>

            {/* Material */}
            <div className="grid grid-cols-[160px_repeat(auto-fit,minmax(220px,1fr))] gap-4 py-4 text-xs">
              <span className="font-semibold text-slate-500">Material & Build</span>
              {items.map((p) => (
                <span key={p.id} className="text-slate-700">
                  {p.material ?? "Premium Grade Components"}
                </span>
              ))}
            </div>

            {/* Description */}
            <div className="grid grid-cols-[160px_repeat(auto-fit,minmax(220px,1fr))] gap-4 py-4 text-xs">
              <span className="font-semibold text-slate-500">Description</span>
              {items.map((p) => (
                <p key={p.id} className="text-slate-600 leading-relaxed">
                  {p.shortDescription ?? p.description}
                </p>
              ))}
            </div>

            {/* Shipping & Delivery */}
            <div className="grid grid-cols-[160px_repeat(auto-fit,minmax(220px,1fr))] gap-4 py-4 text-xs">
              <span className="font-semibold text-slate-500">Shipping</span>
              {items.map((p) => (
                <span key={p.id} className="text-slate-600">
                  {p.shippingNote ?? "Frete grátis em pedidos acima de R$ 299,00."}
                </span>
              ))}
            </div>

            {/* SKU */}
            <div className="grid grid-cols-[160px_repeat(auto-fit,minmax(220px,1fr))] gap-4 py-4 text-xs">
              <span className="font-semibold text-slate-500">SKU</span>
              {items.map((p) => (
                <span key={p.id} className="font-mono text-[11px] text-slate-500">
                  {p.sku}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
