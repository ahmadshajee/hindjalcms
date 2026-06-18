import { NextResponse } from "next/server";
import { updateOrderStatus, removeOrder } from "@/lib/orders";

export const runtime = "nodejs";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json({ error: "Missing status field." }, { status: 400 });
    }

    const updated = await updateOrderStatus(id, body.status);
    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("Failed to update order status", error);
    if (error instanceof Error && error.message.includes("Invalid enum value")) {
       return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update order right now." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await removeOrder(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove order", error);
    return NextResponse.json({ error: "Unable to remove order right now." }, { status: 500 });
  }
}
