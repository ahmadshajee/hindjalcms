import { NextResponse } from "next/server";
import { listOrders } from "@/lib/orders";

export const runtime = "nodejs";

export async function GET() {
  try {
    const orders = await listOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Failed to list orders", error);
    return NextResponse.json({ error: "Unable to load orders right now." }, { status: 500 });
  }
}
