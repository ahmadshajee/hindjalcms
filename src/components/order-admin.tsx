"use client";

import { useEffect, useState } from "react";
import type { CmsOrder } from "@/lib/orders";

type StatusState =
  | { type: "idle"; message: string }
  | { type: "ok"; message: string }
  | { type: "error"; message: string };

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function formatServiceType(type: string) {
  switch (type?.toLowerCase()) {
    case "retail":
      return "Retail Order";
    case "bulk":
      return "Bulk or Event";
    case "corporate":
      return "Corporate Supply";
    default:
      return type || "Retail Order";
  }
}

function formatPaymentMethod(method: string) {
  switch (method?.toLowerCase()) {
    case "upi":
      return "UPI";
    case "card":
      return "Card";
    case "cod":
      return "Cash on Delivery";
    default:
      return method || "UPI";
  }
}

export function OrderAdmin() {
  const [orders, setOrders] = useState<CmsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusState>({ type: "idle", message: "" });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadOrders() {
    try {
      setLoading(true);
      const response = await fetch("/api/orders", { cache: "no-store" });
      const data = (await response.json()) as { orders?: CmsOrder[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load orders.");
      }

      setOrders(data.orders ?? []);
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load orders.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  async function handleStatusChange(order: CmsOrder, newStatus: string) {
    if (order.status === newStatus) return;

    try {
      setUpdatingId(order.id);
      setStatus({ type: "idle", message: "" });

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = (await response.json()) as { order?: CmsOrder; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to update order status.");
      }

      setOrders((prev) => prev.map((o) => (o.id === order.id && data.order ? data.order : o)));
      setStatus({ type: "ok", message: `Order ${order.orderId} status updated.` });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update order status.",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(order: CmsOrder) {
    const confirmed = window.confirm(`Delete order ${order.orderId}? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(order.id);
      setStatus({ type: "idle", message: "" });

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to delete order.");
      }

      await loadOrders();
      setStatus({ type: "ok", message: "Order deleted successfully." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to delete order.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="cms-grid">
      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <h2>Customer Orders</h2>
        <p className="panel-note">View and manage orders submitted from the storefront.</p>

        {status.type !== "idle" ? (
          <div className={`status ${status.type === "ok" ? "status--ok" : "status--error"}`} style={{ marginBottom: "1rem" }}>
            {status.message}
          </div>
        ) : null}

        {loading ? <p className="panel-note">Loading orders...</p> : null}

        {!loading && orders.length === 0 ? <p className="panel-note">No orders found yet.</p> : null}

        <div className="product-list">
          {orders.map((order) => (
            <article className="product-item" key={order.id}>
              <div className="product-top" style={{ alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {order.orderId}
                    <span className="badge badge--info" style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>
                      {formatServiceType(order.serviceType)}
                    </span>
                  </h3>
                  <p>{formatDate(order.createdAt)}</p>
                </div>
                <div className="product-price">{formatCurrency(order.totalAmount)}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "1rem" }}>
                <div>
                  <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "0.25rem" }}>Customer</h4>
                  <p style={{ fontWeight: 600 }}>{order.customerName}</p>
                  <p style={{ margin: "0.2rem 0" }}>
                    <a href={`mailto:${order.email}`} style={{ color: "var(--blue-deep)", textDecoration: "underline" }}>
                      {order.email}
                    </a>
                  </p>
                  <p style={{ margin: "0.2rem 0" }}>
                    <a href={`tel:${order.mobileNumber}`} style={{ color: "var(--blue-deep)", textDecoration: "underline" }}>
                      {order.mobileNumber}
                    </a>
                  </p>
                </div>
                
                <div>
                  <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "0.25rem" }}>Delivery Address</h4>
                  <p style={{ margin: 0 }}>{order.address.street}</p>
                  <p style={{ margin: 0 }}>{order.address.city}, {order.address.state} {order.address.pincode}</p>
                </div>

                <div>
                  <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "0.25rem" }}>Order Details</h4>
                  <p style={{ margin: "0.2rem 0", fontSize: "0.9rem" }}>
                    <strong>Request Type:</strong> {formatServiceType(order.serviceType)}
                  </p>
                  <p style={{ margin: "0.2rem 0", fontSize: "0.9rem" }}>
                    <strong>Payment Method:</strong> {formatPaymentMethod(order.paymentMethod)}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "0.25rem" }}>Items</h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {order.items.map((item, idx) => (
                      <li key={idx} style={{ fontSize: "0.9rem", marginBottom: "0.2rem", display: "flex", justifyContent: "space-between" }}>
                        <span>{item.quantity}x {item.name}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {order.notes && (
                <div style={{ padding: "0.75rem", backgroundColor: "var(--surface)", borderRadius: "8px", marginBottom: "1rem" }}>
                  <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "0.25rem" }}>Notes</h4>
                  <p style={{ fontSize: "0.9rem", margin: 0 }}>{order.notes}</p>
                </div>
              )}

              <div className="product-actions" style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <label htmlFor={`status-${order.id}`} style={{ fontSize: "0.85rem", fontWeight: 500 }}>Status:</label>
                  <select 
                    id={`status-${order.id}`}
                    value={order.status} 
                    onChange={(e) => handleStatusChange(order, e.target.value)}
                    disabled={updatingId === order.id}
                    style={{ padding: "0.3rem 0.5rem", borderRadius: "6px", border: "1px solid var(--border)" }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  {updatingId === order.id && <span style={{ fontSize: "0.8rem", color: "var(--foreground-muted)" }}>Updating...</span>}
                </div>

                <button
                  className="btn btn--earth"
                  type="button"
                  disabled={deletingId === order.id}
                  onClick={() => handleDelete(order)}
                >
                  {deletingId === order.id ? "Removing..." : "Delete Order"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
