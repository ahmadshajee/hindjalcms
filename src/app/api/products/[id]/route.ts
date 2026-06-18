import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { removeProduct, updateProduct } from "@/lib/products";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const payload = await request.json();
    const product = await updateProduct(id, payload);
    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Please fill all required product fields correctly." }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unable to update product.";
    const status = /not found|invalid/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await removeProduct(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete product.";
    const status = /not found|invalid/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
