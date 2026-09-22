"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Clock, Loader2, Search, SearchX, TrendingUp, X } from "lucide-react";
import { useUiStore } from "@/store/ui-store";
import { useSearchStore } from "@/store/search-store";
import { quickSearch, type QuickSearchResult } from "@/server/services/catalog/actions";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const POPULAR_SEARCHES = ["Aventus", "Sauvage", "Black Opium", "Vetiver", "Âmbar"];

const EMPTY_RESULT: QuickSearchResult = { query: "", products: [], categories: [], total: 0 };

export function SearchOverlay() {
  const isOpen = useUiStore((s) => s.isSearchOpen);
  const close = useUiStore((s) => s.closeSearch);
  const recentSearches = useSearchStore((s) => s.recentSearches);
  const addRecent = useSearchStore((s) => s.addRecent);
  const removeRecent = useSearchStore((s) => s.removeRecent);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QuickSearchResult>(EMPTY_RESULT);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the input each time the overlay opens
      setQuery("");
      setResult(EMPTY_RESULT);
      const id = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears results when the query is emptied
      setResult(EMPTY_RESULT);
      return;
    }
    const id = setTimeout(() => {
      const term = query;
      startTransition(async () => {
        const next = await quickSearch(term);
        setResult(next);
      });
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        useUiStore.getState().openSearch();
      }
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const debounced = result.query;
  const matchedProducts = result.products;
  const matchedCategories = result.categories;
  const isSearching = isPending;

  function submitSearch(term: string) {
    if (!term.trim()) return;
    addRecent(term);
    close();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Busca"
            className="fixed inset-x-0 top-0 z-[61] max-h-[85vh] overflow-y-auto rounded-b-2xl bg-background shadow-2xl"
            initial={{ y: "-100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0.6 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="container-page py-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <Search className="size-5 shrink-0 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitSearch(query);
                  }}
                  placeholder="Busque por perfumes, marcas, categorias…"
                  className="flex-1 bg-transparent font-heading text-lg text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-xl"
                />
                {query && (
                  <button
                    aria-label="Limpar busca"
                    onClick={() => setQuery("")}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                  >
                    <X className="size-4" />
                  </button>
                )}
                <button
                  aria-label="Fechar busca"
                  onClick={close}
                  className="hidden shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground sm:block"
                >
                  ESC
                </button>
              </div>

              <div className="py-6">
                {!debounced && !isSearching && (
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          <Clock className="size-3.5" /> Buscas recentes
                        </h3>
                        {recentSearches.length > 0 && (
                          <button
                            onClick={() => useSearchStore.getState().clearRecent()}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                      {recentSearches.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma busca recente ainda.</p>
                      ) : (
                        <ul className="space-y-1">
                          {recentSearches.map((term) => (
                            <li key={term} className="group flex items-center justify-between">
                              <button
                                onClick={() => submitSearch(term)}
                                className="flex-1 rounded-md py-1.5 text-left text-sm text-foreground hover:text-accent"
                              >
                                {term}
                              </button>
                              <button
                                aria-label={`Remover ${term}`}
                                onClick={() => removeRecent(term)}
                                className="rounded p-1 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
                              >
                                <X className="size-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        <TrendingUp className="size-3.5" /> Buscas populares
                      </h3>
                      <ul className="space-y-1">
                        {POPULAR_SEARCHES.map((term) => (
                          <li key={term}>
                            <button
                              onClick={() => submitSearch(term)}
                              className="w-full rounded-md py-1.5 text-left text-sm text-foreground hover:text-accent"
                            >
                              {term}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {isSearching && (
                  <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm">Buscando…</span>
                  </div>
                )}

                {!isSearching && debounced && matchedProducts.length === 0 && matchedCategories.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <SearchX className="size-8 text-muted-foreground" strokeWidth={1.5} />
                    <p className="font-heading text-base font-medium text-foreground">
                      Nenhum resultado para &ldquo;{debounced}&rdquo;
                    </p>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      Tente outro termo de busca ou explore nossas categorias.
                    </p>
                  </div>
                )}

                {!isSearching && debounced && (matchedProducts.length > 0 || matchedCategories.length > 0) && (
                  <div className="space-y-6">
                    {matchedCategories.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          Categorias
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {matchedCategories.map((c) => (
                            <Link
                              key={c.id}
                              href={`/categorias/${c.slug}`}
                              onClick={close}
                              className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent hover:text-accent"
                            >
                              {c.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {matchedProducts.length > 0 && (
                      <div>
                        <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          Produtos
                        </h3>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                          {matchedProducts.map((p) => (
                            <Link
                              key={p.id}
                              href={`/produto/${p.slug}`}
                              onClick={() => {
                                addRecent(debounced);
                                close();
                              }}
                              className="group"
                            >
                              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
                                {p.image && (
                                  <Image
                                    src={p.image.url}
                                    alt={p.image.alt}
                                    fill
                                    sizes="200px"
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                )}
                              </div>
                              <p className="mt-2 line-clamp-1 text-xs font-medium text-foreground">
                                {p.name}
                              </p>
                              <p className="text-xs text-muted-foreground">{formatPrice(p.priceFromCents)}</p>
                            </Link>
                          ))}
                        </div>
                        <button
                          onClick={() => submitSearch(debounced)}
                          className={cn(
                            "mt-4 text-sm font-medium text-accent hover:underline"
                          )}
                        >
                          Ver todos os resultados para &ldquo;{debounced}&rdquo;
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
