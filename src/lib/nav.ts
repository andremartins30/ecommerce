export const NAV_LINKS = [
  { label: "Todos os perfumes", href: "/shop" },
  { label: "Promoções", href: "/shop?collection=sale" },
  { label: "Lançamentos", href: "/shop?collection=new-arrivals" },
  { label: "Categorias", href: "/categories" },
] as const;

export const ACCOUNT_NAV = [
  { label: "Visão geral", href: "/account" },
  { label: "Pedidos", href: "/account/orders" },
  { label: "Favoritos", href: "/wishlist" },
  { label: "Endereços", href: "/account/addresses" },
  { label: "Formas de pagamento", href: "/account/payment-methods" },
  { label: "Perfil", href: "/account/profile" },
  { label: "Configurações", href: "/account/settings" },
] as const;

/**
 * `permission` is presentation only — it hides a menu item a role couldn't
 * use anyway, it is not the enforcement boundary. The real check for every
 * one of these screens' write actions is `requirePermission()` on the
 * server (see src/server/services/auth/rbac.ts). Items with no `permission`
 * are visible to any signed-in admin regardless of role.
 */
export const ADMIN_NAV = [
  { label: "Overview", href: "/admin", icon: "LayoutDashboard" },
  { label: "Analytics", href: "/admin/analytics", icon: "BarChart3" },
  { label: "Products", href: "/admin/products", icon: "Shirt", permission: "product.read" },
  { label: "Categories", href: "/admin/categories", icon: "LayoutGrid", permission: "product.read" },
  { label: "Orders", href: "/admin/orders", icon: "PackageCheck", permission: "order.read" },
  { label: "Customers", href: "/admin/customers", icon: "Users", permission: "customer.read" },
  { label: "Inventory", href: "/admin/inventory", icon: "Boxes", permission: "inventory.read" },
  { label: "Discounts", href: "/admin/discounts", icon: "Ticket", permission: "coupon.write" },
  { label: "Reviews", href: "/admin/reviews", icon: "Star", permission: "review.moderate" },
  { label: "Auditoria", href: "/admin/auditoria", icon: "ClipboardList", permission: "audit.read" },
  { label: "Settings", href: "/admin/settings", icon: "Settings", permission: "settings.write" },
] as const;
