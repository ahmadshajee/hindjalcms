import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDatabase } from "@/lib/mongodb";

const COLLECTION = "orders";

export const orderStatusSchema = z.enum(["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]);

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

export type CmsOrder = {
  id: string;
  orderId: string;
  customerName: string;
  mobileNumber: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  serviceType: string;
  notes: string;
  status: string;
  createdAt: string;
};

function toPublicOrder(doc: Record<string, unknown>): CmsOrder {
  const id = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id ?? "");

  const address = doc.address as Record<string, unknown> || {};

  return {
    id,
    orderId: typeof doc.orderId === "string" ? doc.orderId : "",
    customerName: typeof doc.customerName === "string" ? doc.customerName : "",
    mobileNumber: typeof doc.mobileNumber === "string" ? doc.mobileNumber : "",
    email: typeof doc.email === "string" ? doc.email : "",
    address: {
      street: typeof address.street === "string" ? address.street : "",
      city: typeof address.city === "string" ? address.city : "",
      state: typeof address.state === "string" ? address.state : "",
      pincode: typeof address.pincode === "string" ? address.pincode : "",
    },
    items: Array.isArray(doc.items) ? (doc.items as OrderItem[]) : [],
    totalAmount: Number(doc.totalAmount ?? 0),
    paymentMethod: typeof doc.paymentMethod === "string" ? doc.paymentMethod : "",
    serviceType: typeof doc.serviceType === "string" ? doc.serviceType : "",
    notes: typeof doc.notes === "string" ? doc.notes : "",
    status: typeof doc.status === "string" ? doc.status : "Pending",
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date().toISOString(),
  };
}

export async function listOrders(): Promise<CmsOrder[]> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION);
  const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();

  return docs.map((doc) => toPublicOrder(doc as Record<string, unknown>));
}

export async function updateOrderStatus(id: string, status: string): Promise<CmsOrder> {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid order id.");
  }

  const parsedStatus = orderStatusSchema.parse(status);

  const db = await getDatabase();
  const collection = db.collection(COLLECTION);

  const objectId = new ObjectId(id);
  const existing = await collection.findOne({ _id: objectId });

  if (!existing) {
    throw new Error("Order not found.");
  }

  await collection.updateOne(
    { _id: objectId },
    {
      $set: {
        status: parsedStatus,
      },
    },
  );

  const updated = await collection.findOne({ _id: objectId });

  if (!updated) {
    throw new Error("Updated order could not be loaded.");
  }

  return toPublicOrder(updated as Record<string, unknown>);
}

export async function removeOrder(id: string): Promise<void> {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid order id.");
  }

  const db = await getDatabase();
  const collection = db.collection(COLLECTION);
  const result = await collection.deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    throw new Error("Order not found.");
  }
}
