import type { LegacyProduct as Product, LegacyProductVariant as ProductVariant } from "@/lib/types";
import { unsplash, IMAGE_POOL } from "./images";
import { getCategoryById } from "./categories";
import { daysAgo, pickMany, randInt, seededRandom, slugify } from "./seed";
import { fromReais } from "@/server/domain/pricing/money";

interface ProductSeed {
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  compareAtPrice?: number;
  shortDescription: string;
  description: string;
  material?: string;
  care?: string[];
  imagePoolKey: keyof typeof IMAGE_POOL;
  imageCount: number;
  imageIds?: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  tags: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
}

const seeds: ProductSeed[] = [
  // ---- Apparel ----
  {
    name: "Wool-Blend Overcoat",
    brand: "Fielding & Rye",
    categoryId: "cat-apparel",
    price: 348,
    compareAtPrice: 420,
    shortDescription: "A double-faced wool overcoat cut for a clean, straight silhouette.",
    description:
      "Cut from a double-faced Italian wool blend, this overcoat is built for the transitional months — structured through the shoulder, roomy enough to layer a knit underneath, and finished with horn buttons and a half-belt back. Designed to be the one coat you reach for from October through March.",
    material: "72% wool, 25% polyester, 3% elastane",
    care: ["Dry clean only", "Store on a wide hanger", "Steam to refresh"],
    imagePoolKey: "apparel",
    imageCount: 3,
    colors: [
      { name: "Stone", hex: "#C9BEA9" },
      { name: "Ink", hex: "#23262B" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["outerwear", "wool", "winter"],
    isFeatured: true,
    isBestSeller: true,
  },
  {
    name: "Organic Cotton Oxford Shirt",
    brand: "ARKIVE Studio",
    categoryId: "cat-apparel",
    price: 98,
    shortDescription: "A breathable, garment-dyed oxford with a soft, worn-in hand-feel.",
    description:
      "Woven from 100% organic cotton and garment-dyed for a soft, lived-in finish from the first wear. Cut with a slightly relaxed body, a single chest pocket, and a longer back hem that stays tucked. A quiet, wear-everywhere staple.",
    material: "100% organic cotton",
    care: ["Machine wash cold", "Tumble dry low", "Warm iron if needed"],
    imagePoolKey: "apparel",
    imageCount: 2,
    colors: [
      { name: "White", hex: "#F5F3EE" },
      { name: "Sky", hex: "#A9BCC9" },
      { name: "Olive", hex: "#6B6E52" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    tags: ["shirt", "cotton", "everyday"],
    isBestSeller: true,
  },
  {
    name: "Relaxed Selvedge Denim",
    brand: "North Loom",
    categoryId: "cat-apparel",
    price: 168,
    shortDescription: "13oz Japanese selvedge, cut with a relaxed taper through the leg.",
    description:
      "Woven on vintage shuttle looms from 13oz Japanese selvedge cotton, then cut with a relaxed seat and a gentle taper to the ankle. Left raw and unwashed so the fabric develops a fade that's entirely your own over time.",
    material: "100% cotton selvedge denim",
    care: ["Wash cold, inside out", "Line dry", "Avoid frequent washing to preserve fade"],
    imagePoolKey: "apparel",
    imageCount: 2,
    colors: [
      { name: "Raw Indigo", hex: "#2B3A54" },
      { name: "Washed Black", hex: "#2B2B2E" },
    ],
    sizes: ["28", "30", "32", "34", "36", "38"],
    tags: ["denim", "jeans"],
    isNew: true,
  },
  {
    name: "Merino Crewneck Sweater",
    brand: "ARKIVE Studio",
    categoryId: "cat-apparel",
    price: 128,
    shortDescription: "17.5-micron merino, fully fashioned for a clean, seamless fit.",
    description:
      "Knit from 17.5-micron merino wool that regulates temperature without the itch. Fully fashioned construction means no bulky side seams — just a clean line from shoulder to hem. Layers well under the field jacket or worn alone.",
    material: "100% merino wool",
    care: ["Hand wash cold", "Dry flat", "Do not tumble dry"],
    imagePoolKey: "apparel",
    imageCount: 2,
    colors: [
      { name: "Charcoal", hex: "#3B3C3E" },
      { name: "Ecru", hex: "#E7E0D2" },
      { name: "Rust", hex: "#9C5A38" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["knitwear", "merino"],
    isFeatured: true,
  },
  {
    name: "Waxed Cotton Field Jacket",
    brand: "Halden",
    categoryId: "cat-apparel",
    price: 298,
    shortDescription: "Weatherproof waxed cotton with a corduroy collar and bellows pockets.",
    description:
      "A field jacket built the traditional way — waxed cotton canvas shell, corduroy collar, and bellows pockets that expand to hold what you carry. Re-waxable for another decade of use once the finish wears thin.",
    material: "100% waxed cotton, corduroy trim",
    care: ["Spot clean only", "Re-wax as needed", "Do not dry clean"],
    imagePoolKey: "apparel",
    imageCount: 2,
    colors: [{ name: "Olive", hex: "#565A45" }, { name: "Rust", hex: "#8C4A31" }],
    sizes: ["S", "M", "L", "XL"],
    tags: ["outerwear", "jacket"],
  },
  {
    name: "Heavyweight Pocket Tee",
    brand: "ARKIVE Studio",
    categoryId: "cat-apparel",
    price: 48,
    shortDescription: "8oz combed cotton, cut with a boxier fit and a reinforced pocket.",
    description:
      "An 8oz combed cotton tee, heavier than most and cut with a slightly boxier body so it holds its shape wash after wash. Reinforced pocket stitching and a taped neckline for the long haul.",
    material: "100% combed cotton",
    care: ["Machine wash cold", "Tumble dry low"],
    imagePoolKey: "apparel",
    imageCount: 2,
    colors: [
      { name: "Black", hex: "#1E1E1F" },
      { name: "White", hex: "#F5F3EE" },
      { name: "Clay", hex: "#B57A56" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    tags: ["t-shirt", "basics"],
    isBestSeller: true,
  },

  // ---- Footwear ----
  {
    name: "Leather Court Sneaker",
    brand: "ARKIVE Studio",
    categoryId: "cat-footwear",
    price: 178,
    shortDescription: "Full-grain leather on a cupsole, built to be resoled.",
    description:
      "A minimal court sneaker in full-grain leather, built on a cupsole construction that can be resoled rather than replaced. Designed to look as good with denim as it does with tailoring.",
    material: "Full-grain leather upper, rubber cupsole",
    care: ["Wipe clean with a damp cloth", "Condition leather monthly"],
    imagePoolKey: "footwear",
    imageCount: 3,
    colors: [
      { name: "White", hex: "#F2F0EA" },
      { name: "Black", hex: "#1E1E1F" },
    ],
    sizes: ["7", "8", "9", "10", "11", "12"],
    tags: ["sneaker", "leather"],
    isBestSeller: true,
    isFeatured: true,
  },
  {
    name: "Suede Desert Boot",
    brand: "Halden",
    categoryId: "cat-footwear",
    price: 228,
    shortDescription: "Crepe-soled desert boot in brushed suede.",
    description:
      "A two-eyelet desert boot with a natural crepe sole and a brushed suede upper that softens with wear. Unlined for warmer months, but roomy enough for a heavier sock come winter.",
    material: "Suede upper, crepe rubber sole",
    care: ["Brush suede regularly", "Treat with suede protector before first wear"],
    imagePoolKey: "footwear",
    imageCount: 2,
    colors: [{ name: "Sand", hex: "#C7A57B" }, { name: "Chestnut", hex: "#7A4B2E" }],
    sizes: ["7", "8", "9", "10", "11", "12"],
    tags: ["boot", "suede"],
  },
  {
    name: "Canvas Low-Top",
    brand: "North Loom",
    categoryId: "cat-footwear",
    price: 98,
    shortDescription: "A washed-canvas low-top with a vulcanized sole.",
    description:
      "Washed cotton canvas upper on a vulcanized rubber sole — light, breathable, and built to break in fast. The everyday shoe for warm weather and long walks.",
    material: "Cotton canvas, vulcanized rubber",
    care: ["Machine washable on gentle cycle", "Air dry only"],
    imagePoolKey: "footwear",
    imageCount: 2,
    colors: [
      { name: "Ecru", hex: "#E7E0D2" },
      { name: "Navy", hex: "#2B3247" },
      { name: "Black", hex: "#1E1E1F" },
    ],
    sizes: ["7", "8", "9", "10", "11", "12"],
    tags: ["sneaker", "canvas"],
    isNew: true,
  },
  {
    name: "Nappa Leather Loafer",
    brand: "Kessler",
    categoryId: "cat-footwear",
    price: 248,
    shortDescription: "A hand-stitched penny loafer in soft nappa leather.",
    description:
      "Hand-stitched in nappa leather with a moc-toe apron and a leather sole that dresses up over time. Sits comfortably between the boardroom and the weekend.",
    material: "Nappa leather upper and sole",
    care: ["Condition leather every 2-3 months", "Use a shoe tree between wears"],
    imagePoolKey: "footwear",
    imageCount: 2,
    colors: [{ name: "Cognac", hex: "#8A4B2B" }, { name: "Black", hex: "#1E1E1F" }],
    sizes: ["7", "8", "9", "10", "11", "12"],
    tags: ["loafer", "leather"],
    isFeatured: true,
  },
  {
    name: "Chelsea Boot",
    brand: "Fielding & Rye",
    categoryId: "cat-footwear",
    price: 268,
    shortDescription: "A Goodyear-welted Chelsea boot with an elastic gusset.",
    description:
      "Goodyear-welted for a resoleable lifespan, this Chelsea boot pairs a smooth leather upper with an elastic side gusset for an easy pull-on fit. Built on a leather midsole that molds to your foot.",
    material: "Full-grain leather, leather sole",
    care: ["Polish monthly", "Use a shoe horn to preserve the heel counter"],
    imagePoolKey: "footwear",
    imageCount: 2,
    colors: [{ name: "Black", hex: "#1E1E1F" }, { name: "Chestnut", hex: "#6B4128" }],
    sizes: ["7", "8", "9", "10", "11", "12"],
    tags: ["boot", "leather"],
    isBestSeller: true,
  },

  // ---- Bags & Accessories ----
  {
    name: "Structured Leather Tote",
    brand: "Kessler",
    categoryId: "cat-bags",
    price: 328,
    shortDescription: "A structured work tote in vegetable-tanned leather.",
    description:
      "Cut from vegetable-tanned leather over a structured frame that holds its shape empty or full. Interior laptop sleeve, zip pocket, and a magnetic top closure. Ages into a deep patina with use.",
    material: "Vegetable-tanned full-grain leather",
    care: ["Condition every few months", "Avoid prolonged sun exposure"],
    imagePoolKey: "bags",
    imageCount: 2,
    colors: [{ name: "Black", hex: "#1E1E1F" }, { name: "Cognac", hex: "#8A4B2B" }],
    sizes: [],
    tags: ["bag", "tote", "leather"],
    isFeatured: true,
  },
  {
    name: "Canvas Weekender",
    brand: "North Loom",
    categoryId: "cat-bags",
    price: 198,
    shortDescription: "A duck-canvas weekender with leather trim and shoe compartment.",
    description:
      "Heavyweight duck canvas with full-grain leather trim, a detachable shoulder strap, and a bottom compartment for shoes or a gym kit. Sized to clear most airline carry-on limits.",
    material: "Cotton duck canvas, leather trim",
    care: ["Spot clean canvas", "Condition leather trim occasionally"],
    imagePoolKey: "bags",
    imageCount: 2,
    colors: [{ name: "Olive", hex: "#5B5D45" }, { name: "Navy", hex: "#2B3247" }],
    sizes: [],
    tags: ["bag", "travel"],
  },
  {
    name: "Minimal Cardholder",
    brand: "ARKIVE Studio",
    categoryId: "cat-bags",
    price: 58,
    shortDescription: "A slim, four-pocket cardholder in vegetable-tanned leather.",
    description:
      "Four card pockets and a center cash slot, cut from a single piece of vegetable-tanned leather and edge-painted by hand. Slim enough to disappear into a front pocket.",
    material: "Vegetable-tanned leather",
    care: ["Condition occasionally", "Wipe clean with a dry cloth"],
    imagePoolKey: "bags",
    imageCount: 1,
    colors: [
      { name: "Black", hex: "#1E1E1F" },
      { name: "Cognac", hex: "#8A4B2B" },
      { name: "Sand", hex: "#C7A57B" },
    ],
    sizes: [],
    tags: ["wallet", "accessory"],
    isNew: true,
  },
  {
    name: "Cross-Body Field Bag",
    brand: "Halden",
    categoryId: "cat-bags",
    price: 178,
    shortDescription: "A compact waxed-canvas cross-body with brass hardware.",
    description:
      "A compact cross-body cut from waxed canvas with solid brass hardware and a leather flap closure. Sized for a phone, a wallet, and not much else — deliberately.",
    material: "Waxed cotton canvas, leather trim",
    care: ["Spot clean only", "Re-wax canvas as needed"],
    imagePoolKey: "bags",
    imageCount: 1,
    colors: [{ name: "Olive", hex: "#565A45" }],
    sizes: [],
    tags: ["bag", "crossbody"],
  },

  // ---- Watches ----
  {
    name: "Automatic Field Watch",
    brand: "Auric",
    categoryId: "cat-watches",
    price: 420,
    shortDescription: "A 39mm automatic on a full-grain leather strap.",
    description:
      "A 39mm case houses a Swiss automatic movement visible through an exhibition case back. Sapphire crystal, 100m water resistance, and a full-grain leather strap that's easily swapped.",
    material: "316L stainless steel, sapphire crystal",
    care: ["Wind periodically if not worn daily", "Service every 4-5 years"],
    imagePoolKey: "watches",
    imageCount: 2,
    colors: [{ name: "Black Dial", hex: "#1E1E1F" }, { name: "White Dial", hex: "#EDE9E0" }],
    sizes: [],
    tags: ["watch", "automatic"],
    isFeatured: true,
    isBestSeller: true,
  },
  {
    name: "Minimalist Quartz",
    brand: "ARKIVE Studio",
    categoryId: "cat-watches",
    price: 168,
    shortDescription: "A slim 36mm quartz watch with a domed sapphire crystal.",
    description:
      "A slim, index-free dial and a domed sapphire crystal give this 36mm quartz watch a quiet, architectural feel. Interchangeable 18mm strap fits both leather and mesh bands.",
    material: "Stainless steel, sapphire crystal",
    care: ["Water resistant to 50m", "Replace battery every 2 years"],
    imagePoolKey: "watches",
    imageCount: 2,
    colors: [{ name: "Silver", hex: "#C7C9CC" }, { name: "Gold", hex: "#B99257" }],
    sizes: [],
    tags: ["watch", "quartz"],
  },
  {
    name: "Titanium Dive Watch",
    brand: "Auric",
    categoryId: "cat-watches",
    price: 580,
    shortDescription: "A 300m titanium diver with a unidirectional bezel.",
    description:
      "Grade 2 titanium case for a featherweight feel, 300m water resistance, and a unidirectional ceramic bezel. Lume-filled indices stay legible long after the lights go out.",
    material: "Grade 2 titanium, ceramic bezel",
    care: ["Rinse with fresh water after ocean use", "Service every 5 years"],
    imagePoolKey: "watches",
    imageCount: 2,
    colors: [{ name: "Titanium", hex: "#8B8D8F" }],
    sizes: [],
    tags: ["watch", "dive"],
    isNew: true,
  },

  // ---- Eyewear ----
  {
    name: "Acetate Round Sunglasses",
    brand: "Post & Beam",
    categoryId: "cat-eyewear",
    price: 148,
    shortDescription: "Hand-polished Italian acetate with polarized lenses.",
    description:
      "Cut from thick Italian acetate and hand-polished for a glass-like finish. Polarized lenses cut glare without distorting color. Comes with a hard case and microfiber cloth.",
    material: "Italian acetate, polarized CR-39 lenses",
    care: ["Store in the included case", "Clean with microfiber only"],
    imagePoolKey: "eyewear",
    imageCount: 1,
    colors: [{ name: "Tortoise", hex: "#6B4A2B" }, { name: "Black", hex: "#1E1E1F" }],
    sizes: [],
    tags: ["sunglasses"],
    isBestSeller: true,
  },
  {
    name: "Titanium Optical Frame",
    brand: "Post & Beam",
    categoryId: "cat-eyewear",
    price: 198,
    shortDescription: "A featherweight titanium frame with spring hinges.",
    description:
      "Beta-titanium temples and spring hinges make this optical frame nearly weightless. Ready for prescription or non-prescription lenses at your local optician.",
    material: "Beta-titanium",
    care: ["Clean with lens solution", "Store in a hard case"],
    imagePoolKey: "eyewear",
    imageCount: 1,
    colors: [{ name: "Gunmetal", hex: "#4A4D52" }, { name: "Champagne", hex: "#C9B48A" }],
    sizes: [],
    tags: ["optical", "glasses"],
  },
  {
    name: "Polarized Aviator",
    brand: "ARKIVE Studio",
    categoryId: "cat-eyewear",
    price: 128,
    shortDescription: "A classic aviator silhouette in brushed metal.",
    description:
      "The classic double-bridge silhouette in brushed stainless steel, fitted with polarized glass lenses and adjustable silicone nose pads for an all-day fit.",
    material: "Stainless steel, glass lenses",
    care: ["Rinse with water to remove salt or sunscreen", "Dry with microfiber cloth"],
    imagePoolKey: "eyewear",
    imageCount: 1,
    colors: [{ name: "Gold", hex: "#B99257" }, { name: "Silver", hex: "#C7C9CC" }],
    sizes: [],
    tags: ["sunglasses", "aviator"],
    isNew: true,
  },

  // ---- Audio & Tech ----
  {
    name: "Wireless Over-Ear Headphones",
    brand: "Auric",
    categoryId: "cat-tech",
    price: 298,
    shortDescription: "Adaptive noise-cancelling headphones with 40-hour battery.",
    description:
      "Memory-foam ear cushions wrapped in protein leather, adaptive noise cancellation, and a 40-hour battery life. Multipoint Bluetooth pairs to two devices at once.",
    material: "Aluminum frame, protein leather cushions",
    care: ["Wipe cushions with a dry cloth", "Store in the included case"],
    imagePoolKey: "tech",
    imageCount: 2,
    colors: [{ name: "Charcoal", hex: "#3B3C3E" }, { name: "Sand", hex: "#C7A57B" }],
    sizes: [],
    tags: ["headphones", "audio"],
    isFeatured: true,
    isBestSeller: true,
  },
  {
    name: "Desk Lamp, Task",
    brand: "Post & Beam",
    categoryId: "cat-tech",
    price: 148,
    shortDescription: "A dimmable LED task lamp with a weighted marble base.",
    description:
      "A fully dimmable LED task lamp on an articulating arm, balanced by a weighted marble base. Three color temperatures for reading, focus, or ambient light.",
    material: "Aluminum, marble base",
    care: ["Wipe with a dry cloth", "Avoid submerging base in water"],
    imagePoolKey: "tech",
    imageCount: 1,
    colors: [{ name: "Black", hex: "#1E1E1F" }, { name: "White", hex: "#F2F0EA" }],
    sizes: [],
    tags: ["lighting", "desk"],
  },
  {
    name: "Portable Speaker",
    brand: "Auric",
    categoryId: "cat-tech",
    price: 128,
    shortDescription: "A pocketable speaker with 12-hour battery and IP67 rating.",
    description:
      "Full-range 360-degree sound from a speaker small enough for a jacket pocket. IP67-rated against dust and water, with a 12-hour battery and USB-C fast charging.",
    material: "Aluminum, silicone",
    care: ["Rinse with fresh water if used near saltwater", "Dry before charging"],
    imagePoolKey: "tech",
    imageCount: 1,
    colors: [{ name: "Charcoal", hex: "#3B3C3E" }, { name: "Clay", hex: "#B57A56" }],
    sizes: [],
    tags: ["speaker", "audio"],
    isNew: true,
  },
  {
    name: "Fast-Charge Power Bank",
    brand: "ARKIVE Studio",
    categoryId: "cat-tech",
    price: 68,
    shortDescription: "A 10,000mAh power bank with 65W pass-through charging.",
    description:
      "A pocketable 10,000mAh cell with 65W USB-C pass-through, fast enough to charge a laptop in a pinch. Aluminum housing stays cool under load.",
    material: "Aluminum housing",
    care: ["Store partially charged if unused for long periods"],
    imagePoolKey: "tech",
    imageCount: 1,
    colors: [{ name: "Charcoal", hex: "#3B3C3E" }],
    sizes: [],
    tags: ["charging", "tech"],
  },

  // ---- Fragrance ----
  {
    name: "Eau de Parfum — Santal 26",
    brand: "ARKIVE Studio",
    categoryId: "cat-fragrance",
    price: 128,
    shortDescription: "Sandalwood, cardamom, and cedar in a long-wear formulation.",
    description:
      "A warm, woody composition built around Australian sandalwood, cardamom, and cedar, rounded out with a trace of amber. Formulated at 20% concentration for a wear time that lasts well into the evening.",
    material: "Eau de parfum, 20% concentration",
    care: ["Store away from direct sunlight", "Keep cap on when not in use"],
    imagePoolKey: "fragrance",
    imageCount: 1,
    colors: [],
    sizes: ["30ml", "50ml", "100ml"],
    tags: ["fragrance", "unisex"],
    isFeatured: true,
  },
  {
    name: "Eau de Parfum — Amber Noir",
    brand: "ARKIVE Studio",
    categoryId: "cat-fragrance",
    price: 128,
    shortDescription: "Dark amber, black pepper, and leaccord for evening wear.",
    description:
      "A dense, resinous amber softened with black pepper and a suede-like leather accord. Built to wear well in cold weather — this one leans warm and close to the skin.",
    material: "Eau de parfum, 20% concentration",
    care: ["Store away from direct sunlight", "Keep cap on when not in use"],
    imagePoolKey: "fragrance",
    imageCount: 1,
    colors: [],
    sizes: ["30ml", "50ml", "100ml"],
    tags: ["fragrance", "unisex"],
  },
  {
    name: "Candle — Cedar & Fig",
    brand: "ARKIVE Studio",
    categoryId: "cat-fragrance",
    price: 48,
    shortDescription: "A coconut-wax candle with a 60-hour burn time.",
    description:
      "Hand-poured coconut wax in a reusable ceramic vessel, scented with cedar, fig leaf, and a trace of vetiver. Cotton wick, roughly 60 hours of clean burn time.",
    material: "Coconut wax, ceramic vessel",
    care: ["Trim wick to 1/4in before each burn", "Never leave unattended"],
    imagePoolKey: "fragrance",
    imageCount: 1,
    colors: [],
    sizes: [],
    tags: ["candle", "home fragrance"],
    isBestSeller: true,
  },

  // ---- Home & Living ----
  {
    name: "Ceramic Pour-Over Set",
    brand: "NEBULA Living",
    categoryId: "cat-home",
    price: 78,
    shortDescription: "A hand-glazed ceramic dripper with a matching carafe.",
    description:
      "A hand-glazed stoneware dripper paired with a 600ml carafe. The wide flat-bottom design promotes even extraction; each piece is subtly unique from the kiln.",
    material: "Glazed stoneware",
    care: ["Dishwasher safe", "Avoid extreme temperature shock"],
    imagePoolKey: "home",
    imageCount: 2,
    imageIds: ["1511920170033-f8396924c348", "1495474472287-4d71bcdd2085"],
    colors: [{ name: "Natural", hex: "#E7E0D2" }, { name: "Charcoal", hex: "#3B3C3E" }],
    sizes: [],
    tags: ["kitchen", "coffee"],
    isNew: true,
  },
  {
    name: "Linen Throw Blanket",
    brand: "NEBULA Living",
    categoryId: "cat-home",
    price: 118,
    shortDescription: "A stonewashed linen throw, woven in a heavier weight.",
    description:
      "Stonewashed European linen in a heavier-than-usual weight, so it drapes with real body over a sofa or the foot of a bed. Softens further with every wash.",
    material: "100% linen",
    care: ["Machine wash cold, gentle cycle", "Tumble dry low"],
    imagePoolKey: "home",
    imageCount: 2,
    imageIds: ["1522771739844-6a9f6d5f14af", "1586023492125-27b2c045efd7"],
    colors: [{ name: "Clay", hex: "#B57A56" }, { name: "Fog", hex: "#B9BCC0" }],
    sizes: [],
    tags: ["textile", "living"],
  },
  {
    name: "Hand-Thrown Stoneware Mug Set",
    brand: "NEBULA Living",
    categoryId: "cat-home",
    price: 68,
    shortDescription: "A set of four hand-thrown mugs, no two exactly alike.",
    description:
      "Four hand-thrown stoneware mugs, each subtly unique in shape and glaze pooling. Microwave and dishwasher safe despite the handmade finish.",
    material: "Glazed stoneware",
    care: ["Dishwasher and microwave safe"],
    imagePoolKey: "home",
    imageCount: 2,
    imageIds: ["1572119865084-43c285814d63", "1517256064527-09c73fc73e38"],
    colors: [{ name: "Natural", hex: "#E7E0D2" }],
    sizes: [],
    tags: ["kitchen", "tableware"],
    isBestSeller: true,
  },
  {
    name: "Woven Storage Basket",
    brand: "NEBULA Living",
    categoryId: "cat-home",
    price: 58,
    shortDescription: "A hand-woven seagrass basket with leather handles.",
    description:
      "Hand-woven from seagrass with full-grain leather handles for structure. Equally at home holding throw blankets, plants, or the day's mail.",
    material: "Seagrass, leather handles",
    care: ["Spot clean with a damp cloth", "Keep away from prolonged moisture"],
    imagePoolKey: "home",
    imageCount: 2,
    imageIds: ["1513694203232-719a280e022f", "1586023492125-27b2c045efd7"],
    colors: [{ name: "Natural", hex: "#E7E0D2" }],
    sizes: [],
    tags: ["storage", "living"],
  },
];

function buildVariants(
  rng: () => number,
  sku: string,
  colors: { name: string; hex: string }[],
  sizes: string[]
): ProductVariant[] {
  const colorList = colors.length ? colors.map((c) => c.name) : [undefined];
  const sizeList = sizes.length ? sizes : [undefined];
  const variants: ProductVariant[] = [];
  let i = 0;
  for (const color of colorList) {
    for (const size of sizeList) {
      i++;
      variants.push({
        id: `${sku}-v${i}`,
        color,
        size,
        sku: `${sku}-${(color ?? "DEF").slice(0, 3).toUpperCase()}${size ? `-${size}` : ""}`,
        stock: randInt(rng, 0, 40),
      });
    }
  }
  return variants;
}

/**
 * Authored with prices in reais for readability; `trendingProducts` below
 * converts them to cents so nothing downstream ever sees a decimal amount.
 */
const trendingSeeds: Product[] = [
  {
    id: "nebula-speaker-01",
    slug: "bluetooth-speaker",
    name: "Bluetooth Speaker",
    brand: "NEBULA Sound",
    categoryId: "cat-electronics",
    description: "Deep 360-degree bass and IPX7 water resistance in an ultra-portable cylindrical form factor.",
    shortDescription: "High-fidelity 360-degree wireless acoustic audio.",
    price: 49.99,
    compareAtPrice: 69.99,
    currency: "BRL",
    images: [
      { url: "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=800&h=900&auto=format&fit=crop", alt: "Bluetooth Speaker" },
      { url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800&h=900&auto=format&fit=crop", alt: "Speaker Side View" },
    ],
    colors: [{ name: "Matte Black", hex: "#1A1A1A" }, { name: "Slate Grey", hex: "#4B5563" }],
    sizes: ["Standard"],
    variants: [
      { id: "spk-01-v1", color: "Matte Black", sku: "NEB-SPK-BLK", stock: 35 },
      { id: "spk-01-v2", color: "Slate Grey", sku: "NEB-SPK-GRY", stock: 20 },
    ],
    rating: 4.5,
    reviewCount: 148,
    stock: 55,
    sku: "NEB-SPK-01",
    tags: ["audio", "speaker", "wireless", "electronics"],
    isNew: true,
    isBestSeller: true,
    isFeatured: true,
    status: "active",
    material: "Aircraft aluminum, acoustic mesh",
    shippingNote: "Frete grátis em pedidos acima de R$ 299,00.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "nebula-watch-02",
    slug: "smart-watch",
    name: "Smart Watch",
    brand: "NEBULA Tech",
    categoryId: "cat-electronics",
    description: "AMOLED edge-to-edge display with comprehensive 24/7 health tracking, sleep analytics, and 14-day battery life.",
    shortDescription: "Precision AMOLED fitness & health companion.",
    price: 89.99,
    compareAtPrice: 129.99,
    currency: "BRL",
    images: [
      { url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&h=900&auto=format&fit=crop", alt: "Smart Watch" },
      { url: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=800&h=900&auto=format&fit=crop", alt: "Smart Watch Dial" },
    ],
    colors: [{ name: "Midnight Black", hex: "#0B0C10" }, { name: "Silver Metal", hex: "#D1D5DB" }],
    sizes: ["42mm", "46mm"],
    variants: [
      { id: "wtc-02-v1", color: "Midnight Black", size: "42mm", sku: "NEB-WTC-BLK-42", stock: 40 },
      { id: "wtc-02-v2", color: "Midnight Black", size: "46mm", sku: "NEB-WTC-BLK-46", stock: 25 },
    ],
    rating: 4.6,
    reviewCount: 312,
    stock: 65,
    sku: "NEB-WTC-02",
    tags: ["smartwatch", "wearables", "tech", "watch"],
    isNew: false,
    isBestSeller: true,
    isFeatured: true,
    status: "active",
    material: "Titanium alloy, ceramic backing",
    shippingNote: "Free express delivery included.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "nebula-backpack-03",
    slug: "backpack",
    name: "Backpack",
    brand: "NEBULA Carry",
    categoryId: "cat-fashion",
    description: "Weatherproof structured commuter backpack with padded 16-inch laptop compartment and magnetic quick-release buckles.",
    shortDescription: "Weatherproof 22L minimalist commuter backpack.",
    price: 34.99,
    compareAtPrice: 49.99,
    currency: "BRL",
    images: [
      { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&h=900&auto=format&fit=crop", alt: "Backpack" },
      { url: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=800&h=900&auto=format&fit=crop", alt: "Backpack Detail" },
    ],
    colors: [{ name: "Navy Blue", hex: "#1E293B" }, { name: "Charcoal", hex: "#374151" }],
    sizes: ["One Size"],
    variants: [
      { id: "bpk-03-v1", color: "Navy Blue", sku: "NEB-BPK-NVY", stock: 48 },
    ],
    rating: 4.4,
    reviewCount: 94,
    stock: 48,
    sku: "NEB-BPK-03",
    tags: ["backpack", "travel", "carry", "bags"],
    isNew: true,
    isBestSeller: false,
    isFeatured: true,
    status: "active",
    material: "900D Ballistic Cordura nylon",
    shippingNote: "Ships next business day.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "nebula-earbuds-04",
    slug: "wireless-earbuds",
    name: "Wireless Earbuds",
    brand: "NEBULA Sound",
    categoryId: "cat-electronics",
    description: "Active Noise Cancelling true wireless earbuds with spatial audio processing and fast Qi wireless charging.",
    shortDescription: "ANC earbuds with 32hr battery life.",
    price: 29.99,
    compareAtPrice: 45.00,
    currency: "BRL",
    images: [
      { url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&h=900&auto=format&fit=crop", alt: "Wireless Earbuds" },
      { url: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?q=80&w=800&h=900&auto=format&fit=crop", alt: "Earbuds In Case" },
    ],
    colors: [{ name: "Pure White", hex: "#F9FAFB" }, { name: "Gloss Black", hex: "#111827" }],
    sizes: ["One Size"],
    variants: [
      { id: "ebd-04-v1", color: "Pure White", sku: "NEB-EBD-WHT", stock: 70 },
    ],
    rating: 4.3,
    reviewCount: 218,
    stock: 70,
    sku: "NEB-EBD-04",
    tags: ["audio", "earbuds", "wireless", "anc"],
    isNew: true,
    isBestSeller: true,
    isFeatured: true,
    status: "active",
    material: "Polycarbonate, silicone tips",
    shippingNote: "Free returns within 30 days.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "nebula-bottle-05",
    slug: "stainless-steel-bottle",
    name: "Stainless Steel Bottle",
    brand: "NEBULA Living",
    categoryId: "cat-sports",
    description: "Double-wall vacuum insulated 24oz water bottle keeping drinks ice cold for 24 hours or piping hot for 12 hours.",
    shortDescription: "Vacuum insulated 24oz stainless hydration bottle.",
    price: 19.99,
    compareAtPrice: 28.00,
    currency: "BRL",
    images: [
      { url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&h=900&auto=format&fit=crop", alt: "Stainless Steel Bottle" },
      { url: "https://images.unsplash.com/photo-1544003484-3cd181d17917?q=80&w=800&h=900&auto=format&fit=crop", alt: "Bottle Cap" },
    ],
    colors: [{ name: "Deep Navy", hex: "#1E3A8A" }, { name: "Brushed Steel", hex: "#9CA3AF" }],
    sizes: ["24 oz", "32 oz"],
    variants: [
      { id: "btl-05-v1", color: "Deep Navy", size: "24 oz", sku: "NEB-BTL-NVY-24", stock: 55 },
    ],
    rating: 4.6,
    reviewCount: 165,
    stock: 55,
    sku: "NEB-BTL-05",
    tags: ["bottle", "hydration", "sports", "living"],
    isNew: false,
    isBestSeller: true,
    isFeatured: true,
    status: "active",
    material: "18/8 food-grade stainless steel",
    shippingNote: "BPA-free & lifetime warranty.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "nebula-sunglasses-06",
    slug: "sunglasses",
    name: "Sunglasses",
    brand: "NEBULA Eyewear",
    categoryId: "cat-fashion",
    description: "Polarized UV400 classic black sunglasses with Italian hand-finished cellulose acetate frames.",
    shortDescription: "Polarized UV400 classic handcrafted sunglasses.",
    price: 24.99,
    compareAtPrice: 38.00,
    currency: "BRL",
    images: [
      { url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&h=900&auto=format&fit=crop", alt: "Sunglasses" },
      { url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=800&h=900&auto=format&fit=crop", alt: "Sunglasses Angle" },
    ],
    colors: [{ name: "Obsidian Black", hex: "#18181B" }, { name: "Tortoise Shell", hex: "#78350F" }],
    sizes: ["Standard"],
    variants: [
      { id: "sng-06-v1", color: "Obsidian Black", sku: "NEB-SNG-BLK", stock: 42 },
    ],
    rating: 4.2,
    reviewCount: 88,
    stock: 42,
    sku: "NEB-SNG-06",
    tags: ["sunglasses", "eyewear", "summer", "fashion"],
    isNew: true,
    isBestSeller: false,
    isFeatured: true,
    status: "active",
    material: "Cellulose acetate, polarized polycarbonate lenses",
    shippingNote: "Includes protective hardcase & cloth.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const trendingProducts: Product[] = trendingSeeds.map((product) => ({
  ...product,
  price: fromReais(product.price),
  compareAtPrice:
    product.compareAtPrice === undefined ? undefined : fromReais(product.compareAtPrice),
}));

const baseProducts: Product[] = seeds.map((seed, index) => {
  const rng = seededRandom(`product-${index}-${seed.name}`);
  const slug = slugify(`${seed.name}`);
  const id = `prod-${String(index + 1).padStart(3, "0")}`;
  const sku = `NEB-${slugify(seed.brand).slice(0, 3).toUpperCase()}-${String(index + 1).padStart(3, "0")}`;
  const pool = IMAGE_POOL[seed.imagePoolKey] ?? IMAGE_POOL.apparel;
  const chosenIds = seed.imageIds && seed.imageIds.length > 0 ? seed.imageIds : pickMany(rng, pool, seed.imageCount);
  const images = chosenIds.map((imgId, i) => ({
    url: unsplash(imgId, 1200, 1500),
    alt: `${seed.name} — view ${i + 1}`,
  }));
  const variants = buildVariants(rng, sku, seed.colors, seed.sizes);
  const stock = variants.reduce((sum, v) => sum + v.stock, 0);
  const rating = Math.round((3.6 + rng() * 1.4) * 10) / 10;
  const reviewCount = randInt(rng, 6, 214);
  const createdDaysAgo = seed.isNew ? randInt(rng, 1, 20) : randInt(rng, 25, 340);

  const category = getCategoryById(seed.categoryId);

  return {
    id,
    slug,
    name: seed.name,
    brand: seed.brand,
    categoryId: seed.categoryId,
    description: seed.description,
    shortDescription: seed.shortDescription,
    // Seeds stay readable in reais; cents are produced here, at the single
    // boundary between authored data and the rest of the application.
    price: fromReais(seed.price),
    compareAtPrice: seed.compareAtPrice === undefined ? undefined : fromReais(seed.compareAtPrice),
    currency: "BRL",
    images: images.length ? images : [{ url: unsplash(pool[0]), alt: seed.name }],
    colors: seed.colors,
    sizes: seed.sizes,
    variants,
    rating: Math.min(5, rating),
    reviewCount,
    stock,
    sku,
    tags: [...seed.tags, category?.slug ?? ""].filter(Boolean),
    isNew: !!seed.isNew,
    isBestSeller: !!seed.isBestSeller,
    isFeatured: !!seed.isFeatured,
    status: "active",
    material: seed.material,
    care: seed.care,
    shippingNote: "Frete grátis em pedidos acima de R$ 299,00.",
    createdAt: daysAgo(createdDaysAgo),
    updatedAt: daysAgo(Math.max(0, createdDaysAgo - randInt(rng, 0, 5))),
  };
});

export const products: Product[] = [
  ...baseProducts,
  ...trendingProducts.filter((t) => !baseProducts.some((b) => b.slug === t.slug || b.id === t.id)),
];

export function getProductBySlug(slug: string) {
  const exact = products.find((p) => p.slug === slug);
  if (exact) return exact;

  // Fallback slug aliases
  const normalized = slug.toLowerCase().replace(/[-_]/g, "");
  return products.find(
    (p) =>
      p.slug.toLowerCase().replace(/[-_]/g, "") === normalized ||
      p.name.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized
  );
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(categoryId: string) {
  return products.filter((p) => p.categoryId === categoryId);
}

export function getRelatedProducts(product: Product, count = 4) {
  return products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, count);
}

export const newArrivals = products.filter((p) => p.isNew);
export const bestSellers = products.filter((p) => p.isBestSeller);
export const featuredProducts = products.filter((p) => p.isFeatured);
