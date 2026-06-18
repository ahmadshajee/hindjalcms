import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDatabase } from "@/lib/mongodb";

const COLLECTION = "products";

export const accentSchema = z.enum(["blue", "earth", "mist"]);

const basePayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(140).optional(),
  category: z.string().trim().min(2).max(120),
  description: z.string().trim().min(8).max(1200),
  price: z.number().min(0).max(100000),
  unit: z.string().trim().min(2).max(80),
  tags: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
  accent: accentSchema,
  badge: z.string().trim().max(80).optional().nullable(),
  featured: z.boolean(),
  quoteOnly: z.boolean(),
  ctaLabel: z.string().trim().max(80).optional().nullable(),
  imageUrl: z.string().trim().max(1000).optional().nullable(),
  sortOrder: z.number().int().min(0).max(10000),
  isActive: z.boolean(),
});

export const productPayloadSchema = basePayloadSchema;

export type ProductPayload = z.infer<typeof productPayloadSchema>;

export type CmsProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  tags: string[];
  accent: z.infer<typeof accentSchema>;
  badge?: string;
  featured: boolean;
  quoteOnly: boolean;
  ctaLabel?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const defaultSeed: Array<Omit<CmsProduct, "id" | "createdAt" | "updatedAt">> = [
  {
    slug: "relief-pouch",
    name: "Hind Jal Relief Pouch",
    category: "Everyday relief",
    description: "The entry point to the brand. A fast, affordable pouch for immediate hydration when the moment matters most.",
    price: 5,
    unit: "per pouch",
    tags: ["250 ml", "Pocket-friendly", "Retail-ready"],
    accent: "blue",
    badge: "Best value",
    featured: true,
    quoteOnly: false,
    ctaLabel: "Order pouch",
    imageUrl:
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80",
    sortOrder: 1,
    isActive: true,
  },
  {
    slug: "family-bottle",
    name: "Hind Jal Family Bottle",
    category: "Home use",
    description: "A calm, premium bottle for homes and small teams that want consistent hydration without the heavy feel.",
    price: 18,
    unit: "per bottle",
    tags: ["500 ml", "Easy grip", "Daily use"],
    accent: "mist",
    badge: "",
    featured: false,
    quoteOnly: false,
    ctaLabel: "Add to order",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    sortOrder: 2,
    isActive: true,
  },
  {
    slug: "custom-bulk-program",
    name: "Custom Bulk Program",
    category: "Special orders",
    description: "Tailored institutional supply for schools, charities, offices, and long-term partners with recurring demand.",
    price: 0,
    unit: "custom quote",
    tags: ["Volume pricing", "Dedicated support", "Flexible terms"],
    accent: "earth",
    badge: "",
    featured: false,
    quoteOnly: true,
    ctaLabel: "Request quote",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    sortOrder: 3,
    isActive: true,
  },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toPublicProduct(doc: Record<string, unknown>): CmsProduct {
  const id = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id ?? "");

  return {
    id,
    name: typeof doc.name === "string" ? doc.name : "",
    slug: typeof doc.slug === "string" ? doc.slug : "",
    category: typeof doc.category === "string" ? doc.category : "",
    description: typeof doc.description === "string" ? doc.description : "",
    price: Number(doc.price ?? 0),
    unit: typeof doc.unit === "string" ? doc.unit : "",
    tags: Array.isArray(doc.tags) ? doc.tags.filter((tag): tag is string => typeof tag === "string") : [],
    accent: accentSchema.parse(doc.accent ?? "blue"),
    badge: typeof doc.badge === "string" && doc.badge ? doc.badge : undefined,
    featured: Boolean(doc.featured),
    quoteOnly: Boolean(doc.quoteOnly),
    ctaLabel: typeof doc.ctaLabel === "string" && doc.ctaLabel ? doc.ctaLabel : undefined,
    imageUrl: typeof doc.imageUrl === "string" && doc.imageUrl ? doc.imageUrl : undefined,
    sortOrder: Number(doc.sortOrder ?? 0),
    isActive: typeof doc.isActive === "boolean" ? doc.isActive : true,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : new Date().toISOString(),
  };
}

async function ensureSeed() {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION);
  const count = await collection.countDocuments();

  if (count > 0) {
    return;
  }

  const now = new Date();
  await collection.insertMany(
    defaultSeed.map((seed) => ({
      ...seed,
      createdAt: now,
      updatedAt: now,
    })),
  );
}

async function createUniqueSlug(base: string, excludedId?: string) {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION);

  const safeBase = slugify(base) || "product";
  let attempt = safeBase;
  let counter = 1;

  while (true) {
    const query: Record<string, unknown> = { slug: attempt };

    if (excludedId && ObjectId.isValid(excludedId)) {
      query._id = { $ne: new ObjectId(excludedId) };
    }

    const existing = await collection.findOne(query);
    if (!existing) {
      return attempt;
    }

    counter += 1;
    attempt = `${safeBase}-${counter}`;
  }
}

function normalizePayload(payload: ProductPayload) {
  return {
    ...payload,
    name: payload.name.trim(),
    category: payload.category.trim(),
    description: payload.description.trim(),
    unit: payload.unit.trim(),
    tags: payload.tags.map((tag) => tag.trim()).filter(Boolean),
    slug: payload.slug?.trim() ?? "",
    badge: payload.badge?.trim() || "",
    ctaLabel: payload.ctaLabel?.trim() || "",
    imageUrl: payload.imageUrl?.trim() || "",
  };
}

export async function listProducts(): Promise<CmsProduct[]> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION);
  const docs = await collection.find({}).sort({ sortOrder: 1, createdAt: 1 }).toArray();

  return docs.map((doc) => toPublicProduct(doc as Record<string, unknown>));
}

export async function createProduct(raw: unknown): Promise<CmsProduct> {
  const payload = normalizePayload(productPayloadSchema.parse(raw));

  const db = await getDatabase();
  const collection = db.collection(COLLECTION);

  const slug = await createUniqueSlug(payload.slug || payload.name);
  const now = new Date();

  const document = {
    ...payload,
    slug,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(document);
  const inserted = await collection.findOne({ _id: result.insertedId });

  if (!inserted) {
    throw new Error("Created product could not be loaded.");
  }

  return toPublicProduct(inserted as Record<string, unknown>);
}

export async function updateProduct(id: string, raw: unknown): Promise<CmsProduct> {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid product id.");
  }

  const payload = normalizePayload(productPayloadSchema.parse(raw));
  const db = await getDatabase();
  const collection = db.collection(COLLECTION);

  const objectId = new ObjectId(id);
  const existing = await collection.findOne({ _id: objectId });

  if (!existing) {
    throw new Error("Product not found.");
  }

  const slug = await createUniqueSlug(payload.slug || payload.name, id);

  await collection.updateOne(
    { _id: objectId },
    {
      $set: {
        ...payload,
        slug,
        updatedAt: new Date(),
      },
    },
  );

  const updated = await collection.findOne({ _id: objectId });

  if (!updated) {
    throw new Error("Updated product could not be loaded.");
  }

  return toPublicProduct(updated as Record<string, unknown>);
}

export async function removeProduct(id: string): Promise<void> {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid product id.");
  }

  const db = await getDatabase();
  const collection = db.collection(COLLECTION);
  const result = await collection.deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    throw new Error("Product not found.");
  }
}
