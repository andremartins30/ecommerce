import type { LegacyAddress as Address, LegacyCustomer as Customer, LegacyPaymentMethodOnFile as PaymentMethodOnFile } from "@/lib/types";
import { avatar } from "./images";
import { daysAgo, pick, randInt, seededRandom, slugify } from "./seed";
import { fromReais } from "@/server/domain/pricing/money";

const VIP_THRESHOLD_CENTS = fromReais(4000);

const names = [
  "Amelia Foster",
  "Noah Bennett",
  "Isla Whitfield",
  "Ethan Marsh",
  "Charlotte Reyes",
  "Lucas Hartley",
  "Willow Chen",
  "Mateo Alvarez",
  "Freya Sørensen",
  "Oliver Kingston",
  "Nadia Petrov",
  "Julian Voss",
  "Ines Carvalho",
  "Theo Lindqvist",
  "Sienna Abara",
  "Marcus Webb",
  "Priya Nair",
  "Adrian Solberg",
  "Yuki Tanaka",
  "Rosalind Blackwood",
];

const cities: [string, string, string][] = [
  ["Portland", "OR", "97201"],
  ["Austin", "TX", "78701"],
  ["Brooklyn", "NY", "11201"],
  ["Seattle", "WA", "98101"],
  ["Denver", "CO", "80202"],
  ["Chicago", "IL", "60601"],
  ["San Francisco", "CA", "94103"],
  ["Minneapolis", "MN", "55401"],
  ["Nashville", "TN", "37201"],
  ["Boston", "MA", "02108"],
];

const streets = [
  "Maple Grove Ave",
  "Cedar Hollow Rd",
  "Wren Street",
  "Birchwood Lane",
  "Fifth Avenue",
  "Harbor View Dr",
  "Elm Court",
  "Foundry Row",
  "Lakeside Blvd",
  "Orchard Path",
];

function makeAddress(rng: () => number, name: string, index: number): Address {
  const [city, state, zip] = pick(rng, cities);
  return {
    id: `addr-${index}`,
    label: index === 0 ? "Home" : "Work",
    fullName: name,
    line1: `${randInt(rng, 100, 4899)} ${pick(rng, streets)}`,
    line2: index === 1 ? `Suite ${randInt(rng, 100, 499)}` : undefined,
    city,
    state,
    postalCode: zip,
    country: "United States",
    phone: `(${randInt(rng, 200, 989)}) 555-${String(randInt(rng, 1000, 9999)).slice(0, 4)}`,
    isDefault: index === 0,
  };
}

function makePayment(rng: () => number, index: number): PaymentMethodOnFile {
  const types: PaymentMethodOnFile["type"][] = ["visa", "mastercard", "amex", "paypal"];
  const type = pick(rng, types);
  return {
    id: `pm-${index}`,
    type,
    last4: String(randInt(rng, 1000, 9999)).slice(0, 4),
    expiry: `${String(randInt(rng, 1, 12)).padStart(2, "0")}/${randInt(rng, 27, 30)}`,
    isDefault: index === 0,
  };
}

export const customers: Customer[] = names.map((name, index) => {
  const rng = seededRandom(`customer-${index}-${name}`);
  const ordersCount = randInt(rng, 0, 14);
  // Cents.
  const totalSpent = ordersCount === 0 ? 0 : fromReais(randInt(rng, 180, 8400));
  const status: Customer["status"] =
    totalSpent > VIP_THRESHOLD_CENTS ? "vip" : ordersCount === 0 ? "inactive" : "active";
  const addressCount = randInt(rng, 1, 2);

  return {
    id: `cust-${String(index + 1).padStart(3, "0")}`,
    name,
    email: `${slugify(name).replace(/-/g, ".")}@${pick(rng, [
      "gmail.com",
      "outlook.com",
      "icloud.com",
      "proton.me",
    ])}`,
    avatar: avatar(index),
    phone: `(${randInt(rng, 200, 989)}) 555-${String(randInt(rng, 1000, 9999)).slice(0, 4)}`,
    joinedAt: daysAgo(randInt(rng, 40, 900)),
    status,
    ordersCount,
    totalSpent,
    lastOrderAt: ordersCount > 0 ? daysAgo(randInt(rng, 1, 120)) : undefined,
    addresses: Array.from({ length: addressCount }, (_, i) => makeAddress(rng, name, i)),
    paymentMethods: [makePayment(rng, 0)],
  };
});

export function getCustomerById(id: string) {
  return customers.find((c) => c.id === id);
}
