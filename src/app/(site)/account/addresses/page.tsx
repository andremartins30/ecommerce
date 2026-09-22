"use client";

import { useState } from "react";
import { MapPin, MoreVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { useProfileStore } from "@/store/profile-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddressFormDialog } from "@/components/account/address-form-dialog";
import { EmptyState } from "@/components/common/empty-state";
import type { LegacyAddress as Address } from "@/lib/types";

export default function AddressesPage() {
  const addresses = useProfileStore((s) => s.addresses);
  const removeAddress = useProfileStore((s) => s.removeAddress);
  const setDefaultAddress = useProfileStore((s) => s.setDefaultAddress);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Address | undefined>(undefined);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Addresses</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Manage your shipping addresses.</p>
        </div>
        <Button
          className="gap-1.5"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={MapPin} title="No addresses saved" description="Add an address to speed up checkout." />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <div key={address.id} className="rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{address.label}</p>
                  {address.isDefault && <Badge variant="secondary">Default</Badge>}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                    <MoreVertical className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(address);
                        setDialogOpen(true);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    {!address.isDefault && (
                      <DropdownMenuItem
                        onClick={() => {
                          setDefaultAddress(address.id);
                          toast.success("Default address updated");
                        }}
                      >
                        Set as default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        removeAddress(address.id);
                        toast("Address removed");
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="mt-3 text-sm text-foreground">{address.fullName}</p>
              <p className="text-sm text-muted-foreground">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {address.city}, {address.state} {address.postalCode}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{address.phone}</p>
            </div>
          ))}
        </div>
      )}

      <AddressFormDialog open={dialogOpen} onOpenChange={setDialogOpen} address={editing} />
    </div>
  );
}
