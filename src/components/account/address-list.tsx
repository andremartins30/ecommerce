"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, MoreVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteAddress, setDefaultAddress } from "@/server/services/account/address-actions";
import type { AccountAddress } from "@/server/services/account/address-queries";
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

/** ##### -> #####-### for display; storage stays digits-only. */
function formatCep(cep: string): string {
  return cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
}

export function AddressList({ addresses }: { addresses: AccountAddress[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AccountAddress | undefined>(undefined);

  function handleDelete(address: AccountAddress) {
    startTransition(async () => {
      const result = await deleteAddress(address.id);
      if (result.success) {
        toast.success("Endereço removido");
        router.refresh();
      } else {
        toast.error(result.formError ?? "Não foi possível remover o endereço");
      }
    });
  }

  function handleSetDefault(address: AccountAddress) {
    startTransition(async () => {
      const result = await setDefaultAddress(address.id, "isDefaultShipping");
      if (result.success) {
        toast.success("Endereço padrão atualizado");
        router.refresh();
      } else {
        toast.error(result.formError ?? "Não foi possível atualizar o endereço padrão");
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Endereços</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Gerencie seus endereços de entrega.</p>
        </div>
        <Button
          className="gap-1.5"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> Adicionar endereço
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={MapPin}
            title="Nenhum endereço salvo"
            description="Adicione um endereço para agilizar o checkout."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <div key={address.id} className="rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{address.label}</p>
                  {address.isDefaultShipping && <Badge variant="secondary">Padrão</Badge>}
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
                      Editar
                    </DropdownMenuItem>
                    {!address.isDefaultShipping && (
                      <DropdownMenuItem onClick={() => handleSetDefault(address)}>
                        Tornar padrão
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem variant="destructive" onClick={() => handleDelete(address)}>
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="mt-3 text-sm text-foreground">{address.recipient}</p>
              <p className="text-sm text-muted-foreground">
                {address.street}, {address.number}
                {address.complement ? ` — ${address.complement}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">{address.district}</p>
              <p className="text-sm text-muted-foreground">
                {address.city} - {address.state}, {formatCep(address.postalCode)}
              </p>
              {address.phone && <p className="mt-1 text-sm text-muted-foreground">{address.phone}</p>}
            </div>
          ))}
        </div>
      )}

      <AddressFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        address={editing}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
