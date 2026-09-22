import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestCustomer,
  createTestInventory,
  createTestOrder,
  createTestProduct,
  FAKE_ARGON2ID_HASH,
  prisma,
  resetCatalogue,
  resetTransactional,
} from "../../../tests/setup/db";

/**
 * Proves that the invariants protecting money, stock and order integrity are
 * enforced by PostgreSQL. Each of these would be a silent data corruption if it
 * were only guarded by application code.
 */

beforeAll(async () => {
  await resetTransactional();
  await resetCatalogue();
});

afterAll(async () => {
  await resetTransactional();
  await resetCatalogue();
  await prisma.$disconnect();
});

describe("inventory invariants", () => {
  it("stores onHand and reserved, and derives available", async () => {
    const inventory = await createTestInventory(10, 3);

    expect(inventory.onHand).toBe(10);
    expect(inventory.reserved).toBe(3);
    // `available` is deliberately not a column.
    expect("available" in inventory).toBe(false);
    expect(inventory.onHand - inventory.reserved).toBe(7);
  });

  it("refuses negative onHand", async () => {
    await expect(createTestInventory(-1, 0)).rejects.toThrow(
      /inventories_on_hand_non_negative/
    );
  });

  it("refuses negative reserved", async () => {
    await expect(createTestInventory(10, -1)).rejects.toThrow(
      /inventories_reserved_non_negative/
    );
  });

  it("refuses reserving more than is on hand", async () => {
    // This is the constraint that makes overselling impossible at the storage
    // layer, independent of any application logic.
    await expect(createTestInventory(5, 6)).rejects.toThrow(
      /inventories_reserved_not_above_on_hand/
    );
  });

  it("refuses an update that would push reserved past onHand", async () => {
    const inventory = await createTestInventory(5, 5);

    await expect(
      prisma.inventory.update({ where: { id: inventory.id }, data: { onHand: 4 } })
    ).rejects.toThrow(/inventories_reserved_not_above_on_hand/);
  });

  it("refuses a zero-quantity movement", async () => {
    const inventory = await createTestInventory(10);

    await expect(
      prisma.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          type: "ADJUSTMENT",
          quantityDelta: 0,
          onHandAfter: 10,
          reservedAfter: 0,
          reason: "teste",
        },
      })
    ).rejects.toThrow(/inventory_movements_delta_non_zero/);
  });

  it("requires a reason for manual adjustments and losses", async () => {
    const inventory = await createTestInventory(10);

    for (const type of ["ADJUSTMENT", "LOSS"] as const) {
      await expect(
        prisma.inventoryMovement.create({
          data: {
            inventoryId: inventory.id,
            type,
            quantityDelta: -1,
            onHandAfter: 9,
            reservedAfter: 0,
          },
        })
      ).rejects.toThrow(/inventory_movements_reason_required_for_manual/);
    }

    // A sale needs no typed reason: the order reference is the explanation.
    await expect(
      prisma.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          type: "SALE",
          quantityDelta: -1,
          onHandAfter: 9,
          reservedAfter: 0,
          referenceType: "order",
          referenceId: "some-order",
        },
      })
    ).resolves.toBeDefined();
  });

  it("rejects a blank reason as well as a missing one", async () => {
    const inventory = await createTestInventory(10);

    await expect(
      prisma.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          type: "LOSS",
          quantityDelta: -1,
          onHandAfter: 9,
          reservedAfter: 0,
          reason: "   ",
        },
      })
    ).rejects.toThrow(/inventory_movements_reason_required_for_manual/);
  });

  it("makes a reservation idempotency key unique", async () => {
    const inventory = await createTestInventory(10);
    const key = `res-${Date.now()}`;

    await prisma.inventoryReservation.create({
      data: {
        inventoryId: inventory.id,
        quantity: 2,
        idempotencyKey: key,
        cartId: "cart-1",
        expiresAt: new Date(Date.now() + 900_000),
      },
    });

    // A retried checkout must not be able to hold the same units twice.
    await expect(
      prisma.inventoryReservation.create({
        data: {
          inventoryId: inventory.id,
          quantity: 2,
          idempotencyKey: key,
          cartId: "cart-1",
          expiresAt: new Date(Date.now() + 900_000),
        },
      })
    ).rejects.toThrow();
  });

  it("refuses an orphan reservation with neither order nor cart", async () => {
    const inventory = await createTestInventory(10);

    await expect(
      prisma.inventoryReservation.create({
        data: {
          inventoryId: inventory.id,
          quantity: 1,
          idempotencyKey: `orphan-${Date.now()}`,
          expiresAt: new Date(Date.now() + 900_000),
        },
      })
    ).rejects.toThrow(/inventory_reservations_has_owner/);
  });

  it("refuses a committed reservation without a committed timestamp", async () => {
    const inventory = await createTestInventory(10);

    await expect(
      prisma.inventoryReservation.create({
        data: {
          inventoryId: inventory.id,
          quantity: 1,
          idempotencyKey: `bad-${Date.now()}`,
          cartId: "cart-x",
          status: "COMMITTED",
          expiresAt: new Date(Date.now() + 900_000),
        },
      })
    ).rejects.toThrow(/inventory_reservations_timestamps_match_status/);
  });
});

describe("order integrity", () => {
  it("creates an order whose total equals its components", async () => {
    const order = await createTestOrder({
      subtotalCents: 49980,
      discountCents: 5000,
      shippingCents: 0,
    });

    expect(order.totalCents).toBe(44980);
    expect(order.status).toBe("PENDING");
    expect(order.shipmentPolicy).toBe("SINGLE_SHIPMENT");
  });

  it("refuses a total that does not match subtotal, discount and shipping", async () => {
    // The most valuable constraint here: a wrong total cannot be persisted.
    await expect(
      createTestOrder({
        subtotalCents: 24990,
        discountCents: 0,
        shippingCents: 2490,
        totalCents: 999,
      })
    ).rejects.toThrow(/orders_total_matches_components/);
  });

  it("refuses a discount larger than the subtotal", async () => {
    await expect(
      createTestOrder({ subtotalCents: 10000, discountCents: 20000, shippingCents: 0, totalCents: -10000 })
    ).rejects.toThrow();
  });

  it("refuses a negative amount", async () => {
    await expect(
      createTestOrder({ subtotalCents: -1, discountCents: 0, shippingCents: 0, totalCents: -1 })
    ).rejects.toThrow(/orders_amounts_non_negative/);
  });

  it("keeps an immutable purchase snapshot on the order item", async () => {
    const order = await createTestOrder();
    const item = order.items[0];

    expect(item.nameSnapshot).toBeTruthy();
    expect(item.skuSnapshot).toBeTruthy();
    expect(item.volumeMlSnapshot).toBeGreaterThan(0);
    expect(item.unitPriceCents).toBe(24990);
    expect(item.availabilityTypeSnapshot).toBe("READY_STOCK");
    expect(item.productionLeadTimeDaysSnapshot).toBe(0);
  });

  it("represents a hybrid line: part from stock, part backordered", async () => {
    // Case 4 of the mandatory business cases, at the storage level.
    const order = await createTestOrder({
      item: {
        quantity: 3,
        qtyFromStock: 2,
        qtyBackordered: 1,
        availabilityTypeSnapshot: "READY_STOCK",
        productionLeadTimeDaysSnapshot: 15,
        estimatedProductionReadyAt: new Date(Date.now() + 15 * 86_400_000),
      },
    });

    const item = order.items[0];
    expect(item.qtyFromStock).toBe(2);
    expect(item.qtyBackordered).toBe(1);
    expect(item.qtyFromStock + item.qtyBackordered).toBe(item.quantity);
  });

  it("refuses a split that does not add up to the quantity", async () => {
    await expect(
      createTestOrder({
        item: { quantity: 3, qtyFromStock: 2, qtyBackordered: 0 },
      })
    ).rejects.toThrow(/order_items_split_matches_quantity/);
  });

  it("refuses a backordered line without a production estimate", async () => {
    await expect(
      createTestOrder({
        item: {
          quantity: 1,
          qtyFromStock: 0,
          qtyBackordered: 1,
          estimatedProductionReadyAt: null,
        },
      })
    ).rejects.toThrow(/order_items_backorder_has_estimate/);
  });

  it("refuses a zero quantity line", async () => {
    await expect(
      createTestOrder({ item: { quantity: 0, qtyFromStock: 0, qtyBackordered: 0 } })
    ).rejects.toThrow(/order_items_quantity_positive/);
  });

  it("freezes the promised delivery figures on the order", async () => {
    const order = await createTestOrder();
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        promisedProductionDays: 15,
        promisedHandlingDays: 1,
        promisedTransitMinDays: 3,
        promisedTransitMaxDays: 5,
      },
    });

    // Production and transit are stored as separate figures, never summed into
    // one opaque number.
    expect(updated.promisedProductionDays).toBe(15);
    expect(updated.promisedTransitMinDays).toBe(3);
    expect(updated.promisedTransitMaxDays).toBe(5);
  });

  it("refuses an inverted transit range", async () => {
    const order = await createTestOrder();

    await expect(
      prisma.order.update({
        where: { id: order.id },
        data: { promisedTransitMinDays: 9, promisedTransitMaxDays: 2 },
      })
    ).rejects.toThrow(/orders_transit_range_ordered/);
  });

  it("keeps an append-only status history", async () => {
    const order = await createTestOrder();

    await prisma.orderStatusHistory.createMany({
      data: [
        { orderId: order.id, status: "PENDING" },
        { orderId: order.id, status: "AWAITING_PAYMENT" },
        { orderId: order.id, status: "PAID", automated: true },
      ],
    });

    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" },
    });

    expect(history.map((h) => h.status)).toEqual(["PENDING", "AWAITING_PAYMENT", "PAID"]);
    expect(history[2].automated).toBe(true);
  });

  it("refuses to delete a customer who has orders, protecting history", async () => {
    const order = await createTestOrder();
    await expect(prisma.customer.delete({ where: { id: order.customerId } })).rejects.toThrow();
  });
});

describe("production tasks", () => {
  async function backorderedOrderItem() {
    const order = await createTestOrder({
      item: {
        quantity: 1,
        qtyFromStock: 0,
        qtyBackordered: 1,
        availabilityTypeSnapshot: "MADE_TO_ORDER",
        productionLeadTimeDaysSnapshot: 15,
        estimatedProductionReadyAt: new Date(Date.now() + 15 * 86_400_000),
      },
    });
    return order.items[0];
  }

  it("freezes the promised lead time at purchase time", async () => {
    const item = await backorderedOrderItem();
    const readyAt = new Date(Date.now() + 15 * 86_400_000);

    const task = await prisma.productionTask.create({
      data: {
        orderItemId: item.id,
        quantity: 1,
        promisedLeadTimeDays: 15,
        estimatedProductionReadyAt: readyAt,
      },
    });

    expect(task.status).toBe("WAITING_PRODUCTION");
    expect(task.promisedLeadTimeDays).toBe(15);
    expect(task.productionCompletedAt).toBeNull();
    // OVERDUE is derived, never stored.
    expect("isOverdue" in task).toBe(false);
  });

  it("refuses IN_PRODUCTION without a start timestamp", async () => {
    const item = await backorderedOrderItem();

    await expect(
      prisma.productionTask.create({
        data: {
          orderItemId: item.id,
          quantity: 1,
          status: "IN_PRODUCTION",
          promisedLeadTimeDays: 15,
          estimatedProductionReadyAt: new Date(),
        },
      })
    ).rejects.toThrow(/production_tasks_timestamps_match_status/);
  });

  it("refuses PRODUCTION_COMPLETED without both timestamps", async () => {
    const item = await backorderedOrderItem();

    await expect(
      prisma.productionTask.create({
        data: {
          orderItemId: item.id,
          quantity: 1,
          status: "PRODUCTION_COMPLETED",
          promisedLeadTimeDays: 15,
          estimatedProductionReadyAt: new Date(),
          productionStartedAt: new Date(),
        },
      })
    ).rejects.toThrow(/production_tasks_timestamps_match_status/);
  });

  it("refuses completion earlier than the start", async () => {
    const item = await backorderedOrderItem();
    const now = Date.now();

    await expect(
      prisma.productionTask.create({
        data: {
          orderItemId: item.id,
          quantity: 1,
          status: "PRODUCTION_COMPLETED",
          promisedLeadTimeDays: 15,
          estimatedProductionReadyAt: new Date(now),
          productionStartedAt: new Date(now),
          productionCompletedAt: new Date(now - 3600_000),
        },
      })
    ).rejects.toThrow(/production_tasks_completed_after_started/);
  });
});

describe("payments", () => {
  it("has no column that could hold a card number or CVV", async () => {
    const order = await createTestOrder();
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "fake",
        method: "CREDIT_CARD",
        amountCents: order.totalCents,
        idempotencyKey: `pay-${Date.now()}`,
        cardToken: "tok_abc",
        cardBrand: "visa",
        cardLast4: "4242",
      },
    });

    const columns = Object.keys(payment).map((c) => c.toLowerCase());
    for (const forbidden of ["cardnumber", "pan", "cvv", "cvc", "securitycode"]) {
      expect(columns).not.toContain(forbidden);
    }
    expect(payment.cardLast4).toBe("4242");
    expect(payment.status).toBe("PENDING");
  });

  it("refuses anything other than four digits in cardLast4", async () => {
    const order = await createTestOrder();

    await expect(
      prisma.payment.create({
        data: {
          orderId: order.id,
          provider: "fake",
          method: "CREDIT_CARD",
          amountCents: 1000,
          idempotencyKey: `pay-bad-${Date.now()}`,
          // A full PAN must be impossible to store here.
          cardLast4: "4242424242424242",
        },
      })
    ).rejects.toThrow(/payments_card_last4_is_four_digits/);
  });

  it("makes the payment idempotency key unique", async () => {
    const order = await createTestOrder();
    const key = `pay-dup-${Date.now()}`;

    await prisma.payment.create({
      data: { orderId: order.id, provider: "fake", method: "PIX", amountCents: 1000, idempotencyKey: key },
    });

    await expect(
      prisma.payment.create({
        data: { orderId: order.id, provider: "fake", method: "PIX", amountCents: 1000, idempotencyKey: key },
      })
    ).rejects.toThrow();
  });

  it("requires a reason on a refund", async () => {
    const order = await createTestOrder();

    await expect(
      prisma.refund.create({
        data: {
          orderId: order.id,
          amountCents: 1000,
          reason: "  ",
          idempotencyKey: `ref-${Date.now()}`,
        },
      })
    ).rejects.toThrow(/refunds_reason_present/);
  });
});

describe("webhooks", () => {
  it("makes provider plus event id unique, so a redelivery cannot be processed twice", async () => {
    const eventId = `evt-${Date.now()}`;

    await prisma.webhookEvent.create({
      data: {
        provider: "fake",
        eventId,
        eventType: "payment.approved",
        signatureValid: true,
        payload: { ok: true },
      },
    });

    await expect(
      prisma.webhookEvent.create({
        data: {
          provider: "fake",
          eventId,
          eventType: "payment.approved",
          signatureValid: true,
          payload: { ok: true },
        },
      })
    ).rejects.toThrow();
  });

  it("records a rejected signature instead of discarding it", async () => {
    const event = await prisma.webhookEvent.create({
      data: {
        provider: "fake",
        eventId: `evt-bad-${Date.now()}`,
        eventType: "payment.approved",
        signatureValid: false,
        status: "IGNORED",
        payload: {},
      },
    });

    expect(event.signatureValid).toBe(false);
    expect(event.status).toBe("IGNORED");
  });
});

describe("identity and access", () => {
  it("accepts only an Argon2id hash as a password", async () => {
    await expect(
      prisma.user.create({
        data: { email: `plain.${Date.now()}@example.com`, passwordHash: "senha123" },
      })
    ).rejects.toThrow(/users_password_hash_is_argon2id/);

    await expect(
      prisma.user.create({
        data: { email: `bcrypt.${Date.now()}@example.com`, passwordHash: "$2b$10$abcdefghijklmnop" },
      })
    ).rejects.toThrow(/users_password_hash_is_argon2id/);

    await expect(
      prisma.user.create({
        data: { email: `ok.${Date.now()}@example.com`, passwordHash: FAKE_ARGON2ID_HASH },
      })
    ).resolves.toBeDefined();
  });

  it("stores e-mail in lower case so uniqueness actually holds", async () => {
    await expect(
      prisma.user.create({
        data: { email: `Mixed.Case.${Date.now()}@Example.com`, passwordHash: FAKE_ARGON2ID_HASH },
      })
    ).rejects.toThrow(/users_email_is_lowercase/);
  });

  it("refuses a session that expires before it was created", async () => {
    const { user } = await createTestCustomer();

    await expect(
      prisma.session.create({
        data: {
          userId: user.id,
          tokenHash: `hash-${Date.now()}`,
          expiresAt: new Date(Date.now() - 1000),
        },
      })
    ).rejects.toThrow(/sessions_expires_after_creation/);
  });

  it("grants roles and permissions through the join tables", async () => {
    const suffix = Math.random().toString(36).slice(2, 8);
    const role = await prisma.role.create({
      data: { name: "INVENTORY", label: "Estoque" },
    });
    const permission = await prisma.permission.create({
      data: { key: `inventory.write.${suffix}`, label: "Editar estoque", group: "inventory" },
    });
    await prisma.rolePermission.create({
      data: { roleId: role.id, permissionId: permission.id },
    });

    const { user } = await createTestCustomer();
    const admin = await prisma.adminUser.create({
      data: { userId: user.id, name: "Operador" },
    });
    await prisma.adminUserRole.create({ data: { adminUserId: admin.id, roleId: role.id } });

    const loaded = await prisma.adminUser.findUnique({
      where: { id: admin.id },
      include: { roles: { include: { role: { include: { permissions: true } } } } },
    });

    expect(loaded?.mfaRequired).toBe(true);
    expect(loaded?.roles[0].role.name).toBe("INVENTORY");
    expect(loaded?.roles[0].role.permissions).toHaveLength(1);
  });
});

describe("customers and addresses", () => {
  it("stores documents as digits only", async () => {
    const { customer } = await createTestCustomer();

    await expect(
      prisma.customer.update({
        where: { id: customer.id },
        data: { documentType: "CPF", document: "123.456.789-09" },
      })
    ).rejects.toThrow(/customers_document_digits_only/);

    await expect(
      prisma.customer.update({
        where: { id: customer.id },
        data: { documentType: "CPF", document: "12345678909" },
      })
    ).resolves.toBeDefined();
  });

  it("requires an eight-digit CEP without a mask", async () => {
    const { customer } = await createTestCustomer();

    await expect(
      prisma.customerAddress.create({
        data: {
          customerId: customer.id,
          label: "Trabalho",
          recipient: "Cliente",
          postalCode: "01310-100",
          street: "Rua",
          number: "1",
          district: "Centro",
          city: "São Paulo",
          state: "SP",
        },
      })
    ).rejects.toThrow(/customer_addresses_postal_code_is_eight_digits/);
  });

  it("allows only one default shipping address per customer", async () => {
    const { customer } = await createTestCustomer();

    await expect(
      prisma.customerAddress.create({
        data: {
          customerId: customer.id,
          label: "Outro",
          recipient: "Cliente",
          postalCode: "04538133",
          street: "Rua",
          number: "2",
          district: "Itaim",
          city: "São Paulo",
          state: "SP",
          isDefaultShipping: true,
        },
      })
    ).rejects.toThrow();
  });

  it("restricts state to a Brazilian federative unit", async () => {
    const { customer } = await createTestCustomer();

    await expect(
      prisma.customerAddress.create({
        data: {
          customerId: customer.id,
          label: "Exterior",
          recipient: "Cliente",
          postalCode: "04538133",
          street: "Rua",
          number: "3",
          district: "Centro",
          city: "Lisboa",
          // @ts-expect-error the enum has exactly 27 values; this is the point
          state: "XX",
        },
      })
    ).rejects.toThrow();
  });
});

describe("cart", () => {
  it("does not store a price on the cart line", async () => {
    const { customer } = await createTestCustomer();
    const product = await createTestProduct();

    const cart = await prisma.cart.create({
      data: {
        customerId: customer.id,
        items: { create: { variantId: product.variants[0].id, quantity: 2 } },
      },
      include: { items: true },
    });

    // Price is resolved from the variant on every read, so a tampered or stale
    // amount cannot reach checkout.
    const columns = Object.keys(cart.items[0]).map((c) => c.toLowerCase());
    expect(columns).not.toContain("pricecents");
    expect(columns).not.toContain("price");
    expect(cart.items[0].quantity).toBe(2);
  });

  it("refuses a zero quantity line", async () => {
    const { customer } = await createTestCustomer();
    const product = await createTestProduct();

    await expect(
      prisma.cart.create({
        data: {
          customerId: customer.id,
          items: { create: { variantId: product.variants[0].id, quantity: 0 } },
        },
      })
    ).rejects.toThrow(/cart_items_quantity_positive/);
  });

  it("allows only one cart per customer", async () => {
    const { customer } = await createTestCustomer();
    await prisma.cart.create({ data: { customerId: customer.id } });

    await expect(prisma.cart.create({ data: { customerId: customer.id } })).rejects.toThrow();
  });

  it("refuses a cart with neither a customer nor a session key", async () => {
    await expect(prisma.cart.create({ data: {} })).rejects.toThrow(/carts_has_owner/);
  });
});

describe("coupons and reviews", () => {
  it("refuses a percentage coupon above 100%", async () => {
    await expect(
      prisma.coupon.create({
        data: {
          code: `MAIS150-${Date.now()}`,
          kind: "PERCENTAGE",
          value: 150,
          startsAt: new Date(),
        },
      })
    ).rejects.toThrow(/coupons_value_in_range_for_kind/);
  });

  it("refuses an expiry before the start", async () => {
    await expect(
      prisma.coupon.create({
        data: {
          code: `INVERTIDO-${Date.now()}`,
          kind: "FIXED",
          value: 1000,
          startsAt: new Date(Date.now() + 86_400_000),
          expiresAt: new Date(),
        },
      })
    ).rejects.toThrow(/coupons_period_ordered/);
  });

  it("restricts a rating to 1..5", async () => {
    const order = await createTestOrder();
    const item = order.items[0];

    for (const rating of [0, 6]) {
      await expect(
        prisma.review.create({
          data: {
            productId: item.productId,
            customerId: order.customerId,
            rating,
            title: "Teste",
            body: "Corpo",
          },
        })
      ).rejects.toThrow(/reviews_rating_range/);
    }
  });

  it("links a review to an order, which is what backs the verified-purchase badge", async () => {
    const order = await createTestOrder();
    const item = order.items[0];

    const review = await prisma.review.create({
      data: {
        productId: item.productId,
        customerId: order.customerId,
        orderId: order.id,
        rating: 5,
        title: "Excelente",
        body: "Fixação muito boa.",
      },
    });

    expect(review.orderId).toBe(order.id);
    expect(review.status).toBe("PENDING");
  });

  it("allows only one review per customer per product", async () => {
    const order = await createTestOrder();
    const item = order.items[0];

    await prisma.review.create({
      data: {
        productId: item.productId,
        customerId: order.customerId,
        rating: 4,
        title: "Bom",
        body: "Gostei.",
      },
    });

    await expect(
      prisma.review.create({
        data: {
          productId: item.productId,
          customerId: order.customerId,
          rating: 2,
          title: "Mudei de ideia",
          body: "Outro texto.",
        },
      })
    ).rejects.toThrow();
  });
});

describe("invoices and privacy", () => {
  it("refuses an issued invoice without an access key", async () => {
    const order = await createTestOrder();

    await expect(
      prisma.invoice.create({
        data: {
          orderId: order.id,
          provider: "fake",
          status: "ISSUED",
          totalCents: order.totalCents,
          idempotencyKey: `inv-${Date.now()}`,
        },
      })
    ).rejects.toThrow(/invoices_issued_has_key/);
  });

  it("allows at most one live invoice per order", async () => {
    const order = await createTestOrder();
    await prisma.invoice.create({
      data: {
        orderId: order.id,
        provider: "fake",
        totalCents: order.totalCents,
        idempotencyKey: `inv-a-${Date.now()}`,
      },
    });

    await expect(
      prisma.invoice.create({
        data: {
          orderId: order.id,
          provider: "fake",
          totalCents: order.totalCents,
          idempotencyKey: `inv-b-${Date.now()}`,
        },
      })
    ).rejects.toThrow();
  });

  it("records a versioned consent with its evidence", async () => {
    const { customer } = await createTestCustomer();

    const consent = await prisma.privacyConsent.create({
      data: {
        customerId: customer.id,
        type: "COOKIES_MARKETING",
        granted: true,
        documentVersion: "2026-01-15",
        ipAddress: "203.0.113.10",
        userAgent: "Mozilla/5.0",
      },
    });

    expect(consent.documentVersion).toBe("2026-01-15");
    expect(consent.granted).toBe(true);
  });

  it("keeps a consent row after the customer is removed, without a dangling link", async () => {
    const { user, customer } = await createTestCustomer();
    await prisma.privacyConsent.create({
      data: { customerId: customer.id, type: "TERMS_OF_USE", granted: true, documentVersion: "v1" },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const consents = await prisma.privacyConsent.findMany({ where: { type: "TERMS_OF_USE" } });
    expect(consents.some((c) => c.customerId === null)).toBe(true);
  });
});

describe("audit log", () => {
  it("records who changed what, with a before and after", async () => {
    const { user } = await createTestCustomer();

    const entry = await prisma.auditLog.create({
      data: {
        actorType: "USER",
        actorId: user.id,
        actorLabel: user.email,
        action: "product.price.update",
        entityType: "ProductVariant",
        entityId: "variant-1",
        changes: { priceCents: { before: 24990, after: 22990 } },
        ipAddress: "203.0.113.10",
      },
    });

    expect(entry.changes).toEqual({ priceCents: { before: 24990, after: 22990 } });
  });

  it("survives the removal of the staff member who made the change", async () => {
    const { user } = await createTestCustomer();
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorLabel: user.email,
        action: "inventory.adjust",
        entityType: "Inventory",
        entityId: "inv-1",
      },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const entries = await prisma.auditLog.findMany({ where: { action: "inventory.adjust" } });
    // actorLabel is denormalised precisely so the trail stays readable.
    expect(entries[0].actorId).toBeNull();
    expect(entries[0].actorLabel).toBe(user.email);
  });
});
