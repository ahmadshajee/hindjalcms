import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createProduct, listProducts } from "@/lib/products";

export const runtime = "nodejs";

export async function GET() {
  try {
    const products = await listProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to list products", error);
    return NextResponse.json({ error: "Unable to load products right now." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const product = await createProduct(payload);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Please fill all required product fields correctly." }, { status: 400 });
    }

    console.error("Failed to create product", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create product." }, { status: 500 });
  }
}
