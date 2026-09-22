/**
 * Demonstration catalogue.
 *
 * Every product here is fictional and labelled as a demonstration in its own
 * description. Nothing pretends to be an authentic product of a real house.
 *
 * The contratipos do name the fragrance that inspired them — that is the whole
 * point of the category and it is how the segment is sold — but the reference is
 * kept in dedicated fields (`inspiredBy`, `referenceBrand`, `referenceFragrance`)
 * and always accompanied by the legal disclaimer stored in SystemSetting. The
 * product being sold and the olfactory reference are never conflated.
 *
 * Prices are written in reais for readability and converted to cents by the
 * seeder.
 */

export interface VariantSeed {
  volumeMl: number;
  priceReais: number;
  compareAtPriceReais?: number;
  costPriceReais?: number;
  weightGrams: number;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  availabilityType: "READY_STOCK" | "MADE_TO_ORDER" | "OUT_OF_STOCK" | "DISCONTINUED";
  allowBackorder?: boolean;
  productionLeadTimeDays?: number | null;
  /** Units physically on hand. */
  onHand: number;
  lowStockThreshold?: number;
  ean?: string;
}

export interface ProductSeed {
  slug: string;
  name: string;
  productType: "CONTRATIPO" | "IMPORTADO" | "NICHO" | "OUTRO";
  brandSlug: string;
  categorySlug: string;
  concentrationSlug: string;
  shortDescription: string;
  description: string;
  gender: "MASCULINO" | "FEMININO" | "UNISSEX";
  occasions: ("DIA_A_DIA" | "TRABALHO" | "NOITE" | "FESTA" | "ENCONTRO" | "ESPORTE" | "ESPECIAL")[];
  seasons: ("VERAO" | "OUTONO" | "INVERNO" | "PRIMAVERA")[];
  countryOfOrigin?: string;
  longevity?: string;
  projection?: string;
  inspiredBy?: string;
  referenceBrand?: string;
  referenceFragrance?: string;
  productionLeadTimeDays?: number | null;
  familySlugs: { slug: string; isPrimary?: boolean }[];
  notes: { slug: string; position: "TOP" | "HEART" | "BASE" }[];
  collectionSlugs: string[];
  tags: string[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  imageIds: string[];
  variants: VariantSeed[];
}

export const FRAGRANCE_FAMILIES: { slug: string; name: string; parentSlug?: string; colorHex?: string }[] = [
  { slug: "amadeirado", name: "Amadeirado", colorHex: "#6B4E32" },
  { slug: "aromatico", name: "Aromático", colorHex: "#5D7B4F" },
  { slug: "citrico", name: "Cítrico", colorHex: "#C9A227" },
  { slug: "floral", name: "Floral", colorHex: "#C98BA0" },
  { slug: "frutado", name: "Frutado", colorHex: "#B5533C" },
  { slug: "oriental", name: "Oriental", colorHex: "#7A3B2E" },
  { slug: "ambar", name: "Âmbar", colorHex: "#B5822E" },
  { slug: "couro", name: "Couro", colorHex: "#4A3427" },
  { slug: "chipre", name: "Chipre", colorHex: "#6E7247" },
  { slug: "fougere", name: "Fougère", colorHex: "#4F6B57" },
  { slug: "gourmand", name: "Gourmand", colorHex: "#8B5A2B" },
  { slug: "aquatico", name: "Aquático", colorHex: "#4C7C96" },
  { slug: "almiscarado", name: "Almiscarado", colorHex: "#9A8E7E" },
  // Subfamilies prove the tree works and the taxonomy can grow.
  { slug: "amadeirado-especiado", name: "Amadeirado Especiado", parentSlug: "amadeirado" },
  { slug: "floral-branco", name: "Floral Branco", parentSlug: "floral" },
  { slug: "oriental-baunilha", name: "Oriental Baunilha", parentSlug: "oriental" },
];

export const FRAGRANCE_NOTES: { slug: string; name: string }[] = [
  { slug: "bergamota", name: "Bergamota" },
  { slug: "limao-siciliano", name: "Limão Siciliano" },
  { slug: "laranja-amarga", name: "Laranja Amarga" },
  { slug: "abacaxi", name: "Abacaxi" },
  { slug: "maca-verde", name: "Maçã Verde" },
  { slug: "cassis", name: "Cassis" },
  { slug: "pimenta-rosa", name: "Pimenta Rosa" },
  { slug: "pimenta-preta", name: "Pimenta Preta" },
  { slug: "cardamomo", name: "Cardamomo" },
  { slug: "gengibre", name: "Gengibre" },
  { slug: "lavanda", name: "Lavanda" },
  { slug: "gerânio", name: "Gerânio" },
  { slug: "jasmim", name: "Jasmim" },
  { slug: "rosa-damascena", name: "Rosa Damascena" },
  { slug: "flor-de-laranjeira", name: "Flor de Laranjeira" },
  { slug: "iris", name: "Íris" },
  { slug: "violeta", name: "Violeta" },
  { slug: "sálvia", name: "Sálvia" },
  { slug: "vetiver", name: "Vetiver" },
  { slug: "patchouli", name: "Patchouli" },
  { slug: "cedro", name: "Cedro" },
  { slug: "sandalo", name: "Sândalo" },
  { slug: "madeira-de-oud", name: "Madeira de Oud" },
  { slug: "musgo-de-carvalho", name: "Musgo de Carvalho" },
  { slug: "incenso", name: "Incenso" },
  { slug: "mirra", name: "Mirra" },
  { slug: "ambar-cinzento", name: "Âmbar Cinzento" },
  { slug: "baunilha", name: "Baunilha" },
  { slug: "fava-tonka", name: "Fava Tonka" },
  { slug: "cacau", name: "Cacau" },
  { slug: "cafe", name: "Café" },
  { slug: "couro-suede", name: "Couro Suede" },
  { slug: "almiscar-branco", name: "Almíscar Branco" },
  { slug: "notas-marinhas", name: "Notas Marinhas" },
  { slug: "sal-marinho", name: "Sal Marinho" },
  { slug: "bidula", name: "Bétula" },
];

export const CONCENTRATIONS: {
  slug: string;
  name: string;
  abbreviation?: string;
  minPercent?: number;
  maxPercent?: number;
  position: number;
}[] = [
  { slug: "extrait-de-parfum", name: "Extrait de Parfum", abbreviation: "Extrait", minPercent: 20, maxPercent: 40, position: 1 },
  { slug: "parfum", name: "Parfum", abbreviation: "Parfum", minPercent: 20, maxPercent: 30, position: 2 },
  { slug: "eau-de-parfum", name: "Eau de Parfum", abbreviation: "EDP", minPercent: 15, maxPercent: 20, position: 3 },
  { slug: "eau-de-toilette", name: "Eau de Toilette", abbreviation: "EDT", minPercent: 5, maxPercent: 15, position: 4 },
  { slug: "eau-de-cologne", name: "Eau de Cologne", abbreviation: "EDC", minPercent: 2, maxPercent: 5, position: 5 },
  { slug: "body-splash", name: "Body Splash", minPercent: 1, maxPercent: 3, position: 6 },
  { slug: "outros", name: "Outros", position: 7 },
];

export const BRANDS: {
  slug: string;
  name: string;
  description: string;
  countryCode?: string;
}[] = [
  {
    slug: "atelier-demonstracao",
    name: "Atelier Demonstração",
    description:
      "Marca fictícia usada nos contratipos de demonstração desta instalação. Substitua pela sua marca no painel administrativo.",
    countryCode: "BR",
  },
  {
    slug: "maison-exemplo",
    name: "Maison Exemplo",
    description: "Marca fictícia usada nos perfumes importados de demonstração.",
    countryCode: "FR",
  },
  {
    slug: "casa-olfativa-demo",
    name: "Casa Olfativa Demo",
    description: "Marca fictícia usada nos perfumes de nicho de demonstração.",
    countryCode: "IT",
  },
];

export const CATEGORIES: {
  slug: string;
  name: string;
  description: string;
  position: number;
  parentSlug?: string;
}[] = [
  {
    slug: "contratipos",
    name: "Contratipos",
    description:
      "Fragrâncias inspiradas em perfis olfativos consagrados, produzidas pela nossa casa. Não são os produtos originais das marcas mencionadas.",
    position: 1,
  },
  {
    slug: "importados",
    name: "Importados",
    description: "Perfumes importados, com procedência e concentração informadas.",
    position: 2,
  },
  {
    slug: "nicho",
    name: "Nicho",
    description: "Composições autorais de produção limitada.",
    position: 3,
  },
  {
    slug: "outros",
    name: "Outros",
    description: "Body splash e demais itens de perfumaria.",
    position: 4,
  },
];

export const COLLECTIONS: { slug: string; name: string; description: string; position: number }[] = [
  { slug: "masculinos", name: "Masculinos", description: "Perfis masculinos.", position: 1 },
  { slug: "femininos", name: "Femininos", description: "Perfis femininos.", position: 2 },
  { slug: "unissex", name: "Unissex", description: "Perfis unissex.", position: 3 },
  { slug: "lancamentos", name: "Lançamentos", description: "Novidades do catálogo.", position: 4 },
  { slug: "mais-vendidos", name: "Mais vendidos", description: "Os preferidos da casa.", position: 5 },
  {
    slug: "pronta-entrega",
    name: "Pronta entrega",
    description: "Disponíveis para envio imediato.",
    position: 6,
  },
  {
    slug: "sob-encomenda",
    name: "Sob encomenda",
    description: "Produzidos especialmente para o seu pedido.",
    position: 7,
  },
];

const DEMO_NOTICE =
  "Produto de demonstração, criado para exibir o funcionamento da loja. Substitua pelo seu catálogo real no painel administrativo.";

export const PRODUCTS: ProductSeed[] = [
  // -------------------------------------------------------------------------
  // Multi-volume contratipo: each volume has its own availability, which is the
  // whole reason stock lives on the variant rather than the product.
  // -------------------------------------------------------------------------
  {
    slug: "imperium",
    name: "Imperium",
    productType: "CONTRATIPO",
    brandSlug: "atelier-demonstracao",
    categorySlug: "contratipos",
    concentrationSlug: "extrait-de-parfum",
    shortDescription: "Abacaxi, bétula e musgo em um amadeirado frutado de presença marcante.",
    description: `Composição amadeirada frutada construída sobre abacaxi e bergamota na abertura, com bétula e pimenta rosa no coração e um fundo de musgo de carvalho, âmbar cinzento e baunilha.\n\n${DEMO_NOTICE}`,
    gender: "MASCULINO",
    occasions: ["TRABALHO", "NOITE", "ESPECIAL"],
    seasons: ["OUTONO", "INVERNO", "PRIMAVERA"],
    countryOfOrigin: "BR",
    longevity: "8 a 10 horas",
    projection: "Alta nas primeiras horas",
    inspiredBy: "Aventus",
    referenceBrand: "Creed",
    referenceFragrance: "Aventus",
    familySlugs: [{ slug: "amadeirado", isPrimary: true }, { slug: "frutado" }],
    notes: [
      { slug: "abacaxi", position: "TOP" },
      { slug: "bergamota", position: "TOP" },
      { slug: "maca-verde", position: "TOP" },
      { slug: "bidula", position: "HEART" },
      { slug: "pimenta-rosa", position: "HEART" },
      { slug: "jasmim", position: "HEART" },
      { slug: "musgo-de-carvalho", position: "BASE" },
      { slug: "ambar-cinzento", position: "BASE" },
      { slug: "baunilha", position: "BASE" },
    ],
    collectionSlugs: ["masculinos", "mais-vendidos", "pronta-entrega"],
    tags: ["demo", "amadeirado", "frutado"],
    isFeatured: true,
    isBestSeller: true,
    imageIds: ["1592945403244-b3fbafd7f539", "1541643600914-78b084683601"],
    variants: [
      // 30 ml in stock, 50 ml made to order, 100 ml nearly sold out: the exact
      // scenario from the specification.
      {
        volumeMl: 30,
        priceReais: 149.9,
        weightGrams: 180,
        lengthMm: 45,
        widthMm: 45,
        heightMm: 100,
        availabilityType: "READY_STOCK",
        onHand: 7,
      },
      {
        volumeMl: 50,
        priceReais: 219.9,
        weightGrams: 260,
        lengthMm: 55,
        widthMm: 55,
        heightMm: 120,
        availabilityType: "MADE_TO_ORDER",
        productionLeadTimeDays: 15,
        onHand: 0,
      },
      {
        volumeMl: 100,
        priceReais: 329.9,
        compareAtPriceReais: 389.9,
        weightGrams: 420,
        lengthMm: 65,
        widthMm: 65,
        heightMm: 150,
        availabilityType: "READY_STOCK",
        onHand: 2,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Contratipo A: made to order, no stock. Sells normally and creates
  // production demand.
  // -------------------------------------------------------------------------
  {
    slug: "solaris",
    name: "Solaris",
    productType: "CONTRATIPO",
    brandSlug: "atelier-demonstracao",
    categorySlug: "contratipos",
    concentrationSlug: "eau-de-parfum",
    shortDescription: "Bergamota, pimenta e âmbar em um aromático fougère seco.",
    description: `Abertura cítrica e picante de bergamota e pimenta preta, coração de lavanda e gerânio, fundo de âmbar cinzento e cedro.\n\n${DEMO_NOTICE}`,
    gender: "MASCULINO",
    occasions: ["DIA_A_DIA", "TRABALHO", "ESPORTE"],
    seasons: ["VERAO", "PRIMAVERA"],
    countryOfOrigin: "BR",
    longevity: "6 a 8 horas",
    projection: "Moderada",
    inspiredBy: "Sauvage",
    referenceBrand: "Dior",
    referenceFragrance: "Sauvage",
    productionLeadTimeDays: 15,
    familySlugs: [{ slug: "fougere", isPrimary: true }, { slug: "aromatico" }, { slug: "citrico" }],
    notes: [
      { slug: "bergamota", position: "TOP" },
      { slug: "pimenta-preta", position: "TOP" },
      { slug: "lavanda", position: "HEART" },
      { slug: "gerânio", position: "HEART" },
      { slug: "sálvia", position: "HEART" },
      { slug: "ambar-cinzento", position: "BASE" },
      { slug: "cedro", position: "BASE" },
      { slug: "patchouli", position: "BASE" },
    ],
    collectionSlugs: ["masculinos", "sob-encomenda"],
    tags: ["demo", "fougere"],
    isFeatured: true,
    imageIds: ["1594035910387-fea47794261f"],
    variants: [
      {
        volumeMl: 30,
        priceReais: 129.9,
        weightGrams: 180,
        lengthMm: 45,
        widthMm: 45,
        heightMm: 100,
        availabilityType: "MADE_TO_ORDER",
        onHand: 0,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Contratipo B: five units in stock.
  // -------------------------------------------------------------------------
  {
    slug: "veludo-negro",
    name: "Veludo Negro",
    productType: "CONTRATIPO",
    brandSlug: "atelier-demonstracao",
    categorySlug: "contratipos",
    concentrationSlug: "eau-de-parfum",
    shortDescription: "Café, baunilha e flor de laranjeira em um gourmand envolvente.",
    description: `Gourmand oriental com café e pêra na abertura, jasmim e flor de laranjeira no coração, baunilha, cacau e almíscar branco no fundo.\n\n${DEMO_NOTICE}`,
    gender: "FEMININO",
    occasions: ["NOITE", "FESTA", "ENCONTRO"],
    seasons: ["OUTONO", "INVERNO"],
    countryOfOrigin: "BR",
    longevity: "8 a 12 horas",
    projection: "Alta",
    inspiredBy: "Black Opium",
    referenceBrand: "Yves Saint Laurent",
    referenceFragrance: "Black Opium",
    familySlugs: [{ slug: "gourmand", isPrimary: true }, { slug: "oriental-baunilha" }],
    notes: [
      { slug: "cafe", position: "TOP" },
      { slug: "pimenta-rosa", position: "TOP" },
      { slug: "jasmim", position: "HEART" },
      { slug: "flor-de-laranjeira", position: "HEART" },
      { slug: "baunilha", position: "BASE" },
      { slug: "cacau", position: "BASE" },
      { slug: "almiscar-branco", position: "BASE" },
    ],
    collectionSlugs: ["femininos", "mais-vendidos", "pronta-entrega"],
    tags: ["demo", "gourmand"],
    isBestSeller: true,
    imageIds: ["1615634260167-c8cdede054de"],
    variants: [
      {
        volumeMl: 50,
        priceReais: 189.9,
        weightGrams: 260,
        lengthMm: 55,
        widthMm: 55,
        heightMm: 120,
        availabilityType: "READY_STOCK",
        onHand: 5,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Imported demo: two units left, which exercises the low-stock display.
  // -------------------------------------------------------------------------
  {
    slug: "nordico-vetiver",
    name: "Nórdico Vetiver",
    productType: "IMPORTADO",
    brandSlug: "maison-exemplo",
    categorySlug: "importados",
    concentrationSlug: "eau-de-parfum",
    shortDescription: "Vetiver do Haiti, cítricos e sal marinho.",
    description: `Vetiver seco e mineral, aberto por limão siciliano e sustentado por sal marinho e cedro.\n\n${DEMO_NOTICE}`,
    gender: "UNISSEX",
    occasions: ["DIA_A_DIA", "TRABALHO"],
    seasons: ["VERAO", "PRIMAVERA", "OUTONO"],
    countryOfOrigin: "FR",
    longevity: "7 a 9 horas",
    projection: "Moderada",
    familySlugs: [{ slug: "amadeirado", isPrimary: true }, { slug: "aquatico" }],
    notes: [
      { slug: "limao-siciliano", position: "TOP" },
      { slug: "bergamota", position: "TOP" },
      { slug: "sal-marinho", position: "HEART" },
      { slug: "notas-marinhas", position: "HEART" },
      { slug: "vetiver", position: "BASE" },
      { slug: "cedro", position: "BASE" },
    ],
    collectionSlugs: ["unissex", "pronta-entrega"],
    tags: ["demo", "importado", "vetiver"],
    isFeatured: true,
    imageIds: ["1563170351-be82bc888aa4"],
    variants: [
      {
        volumeMl: 100,
        priceReais: 749.9,
        weightGrams: 430,
        lengthMm: 70,
        widthMm: 70,
        heightMm: 155,
        availabilityType: "READY_STOCK",
        onHand: 2,
        ean: "7899000000017",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Niche demo: made to order with a longer, product-level lead time.
  // -------------------------------------------------------------------------
  {
    slug: "ambar-sacro",
    name: "Âmbar Sacro",
    productType: "NICHO",
    brandSlug: "casa-olfativa-demo",
    categorySlug: "nicho",
    concentrationSlug: "extrait-de-parfum",
    shortDescription: "Incenso, mirra e âmbar em uma composição resinosa.",
    description: `Resinas e madeiras: incenso e mirra sobre um fundo de âmbar, oud e sândalo. Produção em pequenos lotes.\n\n${DEMO_NOTICE}`,
    gender: "UNISSEX",
    occasions: ["NOITE", "ESPECIAL"],
    seasons: ["INVERNO", "OUTONO"],
    countryOfOrigin: "IT",
    longevity: "10 a 12 horas",
    projection: "Moderada, próxima à pele",
    // Longer than the store default on purpose: exercises level 2 of the lead
    // time chain.
    productionLeadTimeDays: 20,
    familySlugs: [{ slug: "oriental", isPrimary: true }, { slug: "ambar" }, { slug: "amadeirado-especiado" }],
    notes: [
      { slug: "incenso", position: "TOP" },
      { slug: "cardamomo", position: "TOP" },
      { slug: "mirra", position: "HEART" },
      { slug: "rosa-damascena", position: "HEART" },
      { slug: "ambar-cinzento", position: "BASE" },
      { slug: "madeira-de-oud", position: "BASE" },
      { slug: "sandalo", position: "BASE" },
    ],
    collectionSlugs: ["unissex", "sob-encomenda"],
    tags: ["demo", "nicho", "oriental"],
    isNew: true,
    imageIds: ["1588405748880-12d1d2a59d75"],
    variants: [
      {
        volumeMl: 75,
        priceReais: 899.9,
        weightGrams: 380,
        lengthMm: 65,
        widthMm: 65,
        heightMm: 140,
        availabilityType: "MADE_TO_ORDER",
        onHand: 0,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Hybrid: three units ship immediately, anything beyond them is produced.
  // -------------------------------------------------------------------------
  {
    slug: "jardim-suspenso",
    name: "Jardim Suspenso",
    productType: "NICHO",
    brandSlug: "casa-olfativa-demo",
    categorySlug: "nicho",
    concentrationSlug: "eau-de-parfum",
    shortDescription: "Íris, violeta e almíscar em um floral pulverulento.",
    description: `Floral em tons de pó: íris e violeta sobre almíscar branco e cedro. As três primeiras unidades saem do estoque; as demais são produzidas sob encomenda.\n\n${DEMO_NOTICE}`,
    gender: "FEMININO",
    occasions: ["DIA_A_DIA", "TRABALHO", "ENCONTRO"],
    seasons: ["PRIMAVERA", "OUTONO"],
    countryOfOrigin: "IT",
    longevity: "6 a 8 horas",
    projection: "Suave",
    familySlugs: [{ slug: "floral", isPrimary: true }, { slug: "almiscarado" }, { slug: "floral-branco" }],
    notes: [
      { slug: "violeta", position: "TOP" },
      { slug: "bergamota", position: "TOP" },
      { slug: "iris", position: "HEART" },
      { slug: "jasmim", position: "HEART" },
      { slug: "almiscar-branco", position: "BASE" },
      { slug: "cedro", position: "BASE" },
      { slug: "iris", position: "BASE" },
    ],
    collectionSlugs: ["femininos", "lancamentos"],
    tags: ["demo", "floral", "hibrido"],
    isNew: true,
    imageIds: ["1557170334-a9632e77c6e4"],
    variants: [
      {
        volumeMl: 50,
        priceReais: 459.9,
        weightGrams: 270,
        lengthMm: 55,
        widthMm: 55,
        heightMm: 125,
        availabilityType: "READY_STOCK",
        allowBackorder: true,
        productionLeadTimeDays: 15,
        onHand: 3,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Explicitly unavailable: not sellable and not producible.
  // -------------------------------------------------------------------------
  {
    slug: "citrico-primeiro",
    name: "Cítrico Primeiro",
    productType: "IMPORTADO",
    brandSlug: "maison-exemplo",
    categorySlug: "importados",
    concentrationSlug: "eau-de-cologne",
    shortDescription: "Cologne clássica de limão, laranja amarga e neroli.",
    description: `Cologne leve e efêmera, para os dias mais quentes. Reposição sem data definida.\n\n${DEMO_NOTICE}`,
    gender: "UNISSEX",
    occasions: ["DIA_A_DIA", "ESPORTE"],
    seasons: ["VERAO"],
    countryOfOrigin: "FR",
    familySlugs: [{ slug: "citrico", isPrimary: true }],
    notes: [
      { slug: "limao-siciliano", position: "TOP" },
      { slug: "laranja-amarga", position: "TOP" },
      { slug: "flor-de-laranjeira", position: "HEART" },
      { slug: "almiscar-branco", position: "BASE" },
    ],
    collectionSlugs: ["unissex"],
    tags: ["demo", "citrico"],
    imageIds: ["1622633874303-4b0c29bb2e26"],
    variants: [
      {
        volumeMl: 100,
        priceReais: 329.9,
        weightGrams: 430,
        lengthMm: 70,
        widthMm: 70,
        heightMm: 150,
        availabilityType: "OUT_OF_STOCK",
        onHand: 0,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Discontinued: kept in the catalogue for history and SEO, never sold again.
  // Note the stock on hand — discontinued wins regardless.
  // -------------------------------------------------------------------------
  {
    slug: "heranca-1998",
    name: "Herança 1998",
    productType: "NICHO",
    brandSlug: "casa-olfativa-demo",
    categorySlug: "nicho",
    concentrationSlug: "parfum",
    shortDescription: "Chipre clássico de musgo, patchouli e couro.",
    description: `Formulação descontinuada, mantida no catálogo apenas como referência histórica.\n\n${DEMO_NOTICE}`,
    gender: "UNISSEX",
    occasions: ["NOITE", "ESPECIAL"],
    seasons: ["INVERNO"],
    countryOfOrigin: "IT",
    familySlugs: [{ slug: "chipre", isPrimary: true }, { slug: "couro" }],
    notes: [
      { slug: "bergamota", position: "TOP" },
      { slug: "musgo-de-carvalho", position: "HEART" },
      { slug: "patchouli", position: "BASE" },
      { slug: "couro-suede", position: "BASE" },
    ],
    collectionSlugs: [],
    tags: ["demo", "chipre", "descontinuado"],
    imageIds: ["1547887538-e3a2f32cb1cc"],
    variants: [
      {
        volumeMl: 100,
        priceReais: 1249.9,
        weightGrams: 450,
        lengthMm: 70,
        widthMm: 70,
        heightMm: 160,
        availabilityType: "DISCONTINUED",
        // Units still on the shelf must not make a discontinued product
        // sellable; this is asserted in the seed test.
        onHand: 1,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // "Other" product type: perfumery beyond eau de parfum.
  // -------------------------------------------------------------------------
  {
    slug: "bruma-corporal-baunilha",
    name: "Bruma Corporal Baunilha",
    productType: "OUTRO",
    brandSlug: "atelier-demonstracao",
    categorySlug: "outros",
    concentrationSlug: "body-splash",
    shortDescription: "Bruma leve de baunilha e fava tonka.",
    description: `Body splash de uso generoso, para reaplicar ao longo do dia.\n\n${DEMO_NOTICE}`,
    gender: "UNISSEX",
    occasions: ["DIA_A_DIA"],
    seasons: ["VERAO", "PRIMAVERA"],
    countryOfOrigin: "BR",
    familySlugs: [{ slug: "gourmand", isPrimary: true }],
    notes: [
      { slug: "baunilha", position: "TOP" },
      { slug: "fava-tonka", position: "BASE" },
      { slug: "almiscar-branco", position: "BASE" },
    ],
    collectionSlugs: ["unissex", "pronta-entrega"],
    tags: ["demo", "body-splash"],
    imageIds: ["1596462502278-27bfdc403348"],
    variants: [
      {
        volumeMl: 200,
        priceReais: 79.9,
        weightGrams: 520,
        lengthMm: 60,
        widthMm: 60,
        heightMm: 180,
        availabilityType: "READY_STOCK",
        onHand: 24,
        lowStockThreshold: 6,
      },
    ],
  },
];

export const COUPONS: {
  code: string;
  kind: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minOrderReais?: number;
  usageLimit?: number;
}[] = [
  { code: "BEMVINDO10", kind: "PERCENTAGE", value: 10, usageLimit: 1000 },
  { code: "FRETEGRATIS", kind: "FREE_SHIPPING", value: 0, minOrderReais: 199 },
  { code: "NICHO50", kind: "FIXED", value: 50, minOrderReais: 399, usageLimit: 200 },
];
