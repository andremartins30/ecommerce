/**
 * Curated, verified Unsplash photo IDs grouped by product category.
 * Using a fixed pool (rather than random Unsplash queries) keeps images
 * stable across builds/deploys and avoids broken-image states.
 */
export function unsplash(id: string, w = 1200, h = 1500) {
  return `https://images.unsplash.com/photo-${id}?q=80&w=${w}&h=${h}&auto=format&fit=crop`;
}

export const NEBULA_ASSETS = {
  heroModel: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&h=1400&auto=format&fit=crop",
  heroModelFashion: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=1200&h=1400&auto=format&fit=crop",
  
  // 8 Circular Categories
  categories: {
    fashion: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&h=600&auto=format&fit=crop",
    beauty: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&h=600&auto=format&fit=crop",
    electronics: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&h=600&auto=format&fit=crop",
    home: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600&h=600&auto=format&fit=crop",
    sports: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&h=600&auto=format&fit=crop",
    toys: "https://images.unsplash.com/photo-1559454403-b8fb88521f11?q=80&w=600&h=600&auto=format&fit=crop",
    automotive: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=600&h=600&auto=format&fit=crop",
    books: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&h=600&auto=format&fit=crop",
  },

  // 6 Trending Products
  trending: {
    speaker: "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=800&h=900&auto=format&fit=crop",
    watch: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&h=900&auto=format&fit=crop",
    backpack: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&h=900&auto=format&fit=crop",
    earbuds: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&h=900&auto=format&fit=crop",
    bottle: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&h=900&auto=format&fit=crop",
    sunglasses: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&h=900&auto=format&fit=crop",
  },

  // Dual Promos
  promos: {
    summerSale: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&h=700&auto=format&fit=crop",
    freshFinds: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1000&h=700&auto=format&fit=crop",
  },

  // 4 Featured Collections
  collections: {
    outfits: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&h=700&auto=format&fit=crop",
    skincare: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&h=700&auto=format&fit=crop",
    gaming: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?q=80&w=800&h=700&auto=format&fit=crop",
    living: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&h=700&auto=format&fit=crop",
  },
};

export const IMAGE_POOL: Record<string, string[]> = {
  apparel: [
    "1539571696357-5a69c17a67c6",
    "1596755094514-f87e34085b2c",
    "1542272604-787c3835535d",
    "1620799140408-edc6dcb6d633",
    "1551028719-00167b16eac5",
    "1521572267360-ee0c2909d518",
    "1544441893-675973e31985",
    "1602810318383-e386cc2a3ccf",
    "1541099649105-f69ad21f3246",
    "1576566588028-4147f3842f27",
  ],
  footwear: [
    "1560769629-975ec94e6a86",
    "1549298916-b41d501d3772",
    "1525966222134-fcfa99b8ae77",
    "1533867617858-e7b97e060509",
    "1638247025967-b4e38f787b76",
    "1595950653106-6c9ebd614d3a",
    "1520639888713-7851133b1ed0",
    "1607522370275-f14206abe5d3",
    "1582890726197-6a17b6531b79",
    "1608256246200-53e635b5b65f",
  ],
  bags: [
    "1584917865442-de89df76afd3",
    "1553062407-98eeb64c6a62",
    "1627123424574-724758594e93",
    "1590874103328-eac38a683ce7",
    "1548036328-c9fa89d128fa",
    "1577733966973-d680bffd2e80",
    "1607604276583-eef5d076aa5f",
    "1544816155-12df9643f363",
  ],
  watches: [
    "1524805444758-089113d48a6d",
    "1523275335684-37898b6baf30",
    "1546868871-7041f2a55e12",
    "1522335789203-aabd1fc54bc9",
    "1508685096489-7aacd43bd3b1",
    "1533139502658-0198f920d8e8",
  ],
  eyewear: [
    "1511499767150-a48a237f0083",
    "1574258495973-f010dfbb5371",
    "1473496169904-658ba7c44d8a",
    "1572635196237-14b3f281503f",
    "1591076482161-42ce6da69f67",
    "1508296695146-257a814070b4",
  ],
  tech: [
    "1505740420928-5e560c06d30e",
    "1507473885765-e6ed057f782c",
    "1545454675-3531b543be5d",
    "1609091839311-d5365f9ff1c5",
    "1484704849700-f032a568e944",
    "1513506003901-1e6a229e2d15",
    "1608043152269-423dbba4e7e1",
    "1609592424361-ec8531777265",
  ],
  fragrance: [
    "1594633312681-425c7b97ccd1",
    "1592945403244-b3fbafd7f539",
    "1603006905003-be475563bc59",
    "1541643600914-78b084683601",
    "1587017539504-67cfbddac569",
  ],
  home: [
    "1514432324607-a09d9b4aefdd",
    "1584100936595-c0654b55a2e2",
    "1577937927133-66ef06acdf18",
    "1586023492125-27b2c045efd7",
    "1517256064527-09c73fc73e38",
    "1522771739844-6a9f6d5f14af",
    "1513694203232-719a280e022f",
  ],
};

export const HERO_IMAGES = {
  home: unsplash("1441984904996-e0b6ba687e04", 1800, 2000),
  homeSecondary: unsplash("1490481651871-ab68de25d43d", 1400, 1700),
  editorial: unsplash("1441986300917-64674bd600d8", 1800, 1200),
  promo: unsplash("1516762689617-e1cffcef479d", 1800, 900),
};

export const AVATAR_POOL = [
  "1500648767791-00dcc994a43e",
  "1494790108377-be9c29b29330",
  "1472099645785-5658abf4ff4e",
  "1517841905240-472988babdf9",
  "1544005313-94ddf0286df2",
  "1508214751196-bcfd4ca60f91",
  "1506794778202-cad84cf45f1d",
  "1524504388940-b1c1722653e1",
  "1552058544-f2b08422138a",
  "1519085360753-af0119f7cbe7",
];

export function avatar(index: number, w = 128, h = 128) {
  const id = AVATAR_POOL[index % AVATAR_POOL.length];
  return unsplash(id, w, h);
}
