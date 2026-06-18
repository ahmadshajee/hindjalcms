"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductAdmin } from "@/components/product-admin";
import { OrderAdmin } from "@/components/order-admin";

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Failed to sign out", err);
    }
  };

  return (
    <div className="cms-shell">
      <div className="cms-container">
        <header className="cms-header" style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
            <div>
              <span className="badge badge--info" style={{ marginBottom: "0.5rem" }}>Hindjal CMS portal</span>
              <h1>Manage products and orders for the live Hind Jal storefront</h1>
            </div>
            <button className="btn btn--ghost" onClick={handleLogout} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
              Sign Out
            </button>
          </div>
          <p>
            Add or remove catalog items, update prices, and manage customer orders seamlessly.
          </p>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
            <button
              className={`btn ${activeTab === "products" ? "btn--primary" : "btn--ghost"}`}
              onClick={() => setActiveTab("products")}
              style={{ padding: "0.5rem 1rem" }}
            >
              Products
            </button>
            <button
              className={`btn ${activeTab === "orders" ? "btn--primary" : "btn--ghost"}`}
              onClick={() => setActiveTab("orders")}
              style={{ padding: "0.5rem 1rem" }}
            >
              Orders
            </button>
          </div>
        </header>

        {activeTab === "products" && <ProductAdmin />}
        {activeTab === "orders" && <OrderAdmin />}
      </div>
    </div>
  );
}
