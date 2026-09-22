import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, DollarSign, Mail, MapPin, Package, Phone, Repeat } from "lucide-react";
import { getCustomerById } from "@/lib/data/customers";
import { getOrdersByCustomer } from "@/lib/data/orders";
import { MetricCard } from "@/components/common/metric-card";
import { OrderStatusBadge, StatusBadge } from "@/components/common/status-badge";
import { formatDate, formatPrice } from "@/lib/format";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = getCustomerById(id);
  if (!customer) notFound();

  const customerOrders = getOrdersByCustomer(customer.id);

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Back to Customers
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted">
            {customer.avatar && <Image src={customer.avatar} alt={customer.name} fill className="object-cover" sizes="64px" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold text-foreground">{customer.name}</h1>
              <StatusBadge status={customer.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Customer since {formatDate(customer.joinedAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <MetricCard label="Lifetime Value" value={customer.totalSpent} prefix="$" icon={DollarSign} />
        <MetricCard label="Total Orders" value={customer.ordersCount} icon={Package} />
        <MetricCard
          label="Avg. Order Value"
          value={customer.ordersCount ? Math.round(customer.totalSpent / customer.ordersCount) : 0}
          prefix="$"
          icon={Repeat}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Order History</h2>
          {customerOrders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Order</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customerOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3.5">
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-foreground hover:underline">
                          #{order.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3.5"><OrderStatusBadge status={order.status} /></td>
                      <td className="px-4 py-3.5 text-right font-medium text-foreground">{formatPrice(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border p-5">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Contact</h2>
            <div className="mt-3 space-y-2 text-sm text-foreground">
              <p className="flex items-center gap-2"><Mail className="size-3.5 text-muted-foreground" /> {customer.email}</p>
              <p className="flex items-center gap-2"><Phone className="size-3.5 text-muted-foreground" /> {customer.phone}</p>
            </div>
          </div>
          {customer.addresses.map((address) => (
            <div key={address.id} className="rounded-2xl border border-border p-5">
              <h2 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <MapPin className="size-3.5" /> {address.label}
              </h2>
              <p className="mt-2 text-sm text-foreground">{address.fullName}</p>
              <p className="text-sm text-muted-foreground">
                {address.line1}, {address.city}, {address.state} {address.postalCode}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
