import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriceDisplay } from "./price-display";
import { OrderSummary } from "@/components/cart/order-summary";
import { products } from "@/lib/data/products";
import { orders } from "@/lib/data/orders";
import { customers } from "@/lib/data/customers";
import { formatPrice } from "@/lib/format";

describe("PriceDisplay", () => {
  it("renders cents as Brazilian currency", () => {
    render(<PriceDisplay price={24990} />);
    expect(screen.getByText("R$ 249,90")).toBeInTheDocument();
  });

  it("shows the compare-at price and the discount percentage", () => {
    render(<PriceDisplay price={24990} compareAtPrice={29990} />);

    expect(screen.getByText("R$ 249,90")).toBeInTheDocument();
    expect(screen.getByText("R$ 299,90")).toBeInTheDocument();
    expect(screen.getByText("-17%")).toBeInTheDocument();
  });

  it("omits the discount when there is none", () => {
    render(<PriceDisplay price={24990} compareAtPrice={24990} />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});

describe("OrderSummary", () => {
  it("shows subtotal, shipping and total in BRL without a tax row", () => {
    render(<OrderSummary subtotal={24990} shipping={2490} total={27480} />);

    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Frete")).toBeInTheDocument();
    expect(screen.getByText("R$ 274,80")).toBeInTheDocument();
    expect(screen.queryByText(/tax/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/imposto/i)).not.toBeInTheDocument();
  });

  it("labels free shipping", () => {
    render(<OrderSummary subtotal={50000} shipping={0} total={50000} />);
    expect(screen.getByText("Grátis")).toBeInTheDocument();
  });
});

/**
 * Guard against a reais amount surviving anywhere in the data layer:
 * formatPrice throws on non-integer input, so formatting every monetary field
 * of every record is a cheap way to prove the conversion is complete.
 */
describe("monetary data is stored in cents everywhere", () => {
  it("formats every product price", () => {
    for (const product of products) {
      expect(() => formatPrice(product.price)).not.toThrow();
      const { compareAtPrice } = product;
      if (compareAtPrice !== undefined) {
        expect(() => formatPrice(compareAtPrice)).not.toThrow();
      }
    }
  });

  it("formats every order total", () => {
    for (const order of orders) {
      for (const amount of [order.subtotal, order.discount, order.shipping, order.total]) {
        expect(() => formatPrice(amount)).not.toThrow();
      }
      for (const item of order.items) {
        expect(() => formatPrice(item.price)).not.toThrow();
      }
    }
  });

  it("formats every customer lifetime value", () => {
    for (const customer of customers) {
      expect(() => formatPrice(customer.totalSpent)).not.toThrow();
    }
  });

  it("keeps order totals internally consistent", () => {
    for (const order of orders) {
      const itemsTotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      expect(order.subtotal).toBe(itemsTotal);
      expect(order.total).toBe(order.subtotal - order.discount + order.shipping);
    }
  });
});
