"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAdminCategoriesStore } from "@/store/admin-categories-store";
import { useAdminProductsStore } from "@/store/admin-products-store";
import { slugify } from "@/lib/data/seed";
import type { LegacyCategory as Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(1, "Description is required"),
  image: z.string().min(1, "Image URL is required"),
});
type CategoryValues = z.infer<typeof categorySchema>;

export default function AdminCategoriesPage() {
  const categories = useAdminCategoriesStore((s) => s.categories);
  const upsertCategory = useAdminCategoriesStore((s) => s.upsertCategory);
  const deleteCategory = useAdminCategoriesStore((s) => s.deleteCategory);
  const products = useAdminProductsStore((s) => s.products);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>(undefined);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryValues>({ resolver: zodResolver(categorySchema) });

  useEffect(() => {
    if (dialogOpen) {
      reset(editing ?? { name: "", description: "", image: "" });
    }
  }, [dialogOpen, editing, reset]);

  function onSubmit(values: CategoryValues) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        upsertCategory({
          id: editing?.id ?? `cat-${Date.now()}`,
          slug: editing?.slug ?? slugify(values.name),
          name: values.name,
          description: values.description,
          image: values.image,
          productCount: editing?.productCount ?? 0,
        });
        toast.success(editing ? "Category updated" : "Category created");
        setDialogOpen(false);
        resolve();
      }, 500);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">{categories.length} categories</p>
        </div>
        <Button
          className="gap-1.5"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> Add Category
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const count = products.filter((p) => p.categoryId === category.id).length;
          return (
            <div key={category.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-[16/9] bg-muted">
                {category.image && (
                  <Image src={category.image} alt={category.name} fill className="object-cover" sizes="360px" />
                )}
              </div>
              <div className="flex items-start justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{category.name}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{category.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{count} products</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted">
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(category);
                        setDialogOpen(true);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        deleteCategory(category.id);
                        toast("Category deleted");
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} {...register("description")} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" {...register("image")} />
              {errors.image && <p className="text-xs text-destructive">{errors.image.message}</p>}
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="category-form" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
