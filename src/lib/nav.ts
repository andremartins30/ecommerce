export const NAV_LINKS = [
  { label: "Todos os perfumes", href: "/shop" },
  { label: "Promoções", href: "/shop?collection=sale" },
  { label: "Lançamentos", href: "/shop?collection=new-arrivals" },
  { label: "Categorias", href: "/categories" },
] as const;

export const ACCOUNT_NAV = [
  { label: "Overview", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Addresses", href: "/account/addresses" },
  { label: "Payment Methods", href: "/account/payment-methods" },
  { label: "Profile", href: "/account/profile" },
  { label: "Settings", href: "/account/settings" },
] as const;

export const ADMIN_NAV = [
  { label: "Overview", href: "/admin", icon: "LayoutDashboard" },
  { label: "Analytics", href: "/admin/analytics", icon: "BarChart3" },
  { label: "Products", href: "/admin/products", icon: "Shirt" },
  { label: "Categories", href: "/admin/categories", icon: "LayoutGrid" },
  { label: "Orders", href: "/admin/orders", icon: "PackageCheck" },
  { label: "Customers", href: "/admin/customers", icon: "Users" },
  { label: "Inventory", href: "/admin/inventory", icon: "Boxes" },
  { label: "Discounts", href: "/admin/discounts", icon: "Ticket" },
  { label: "Reviews", href: "/admin/reviews", icon: "Star" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
] as const;
