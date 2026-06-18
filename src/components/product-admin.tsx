"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { CmsProduct } from "@/lib/products";

type StatusState =
  | { type: "idle"; message: string }
  | { type: "ok"; message: string }
  | { type: "error"; message: string };

type ProductForm = {
  name: string;
  slug: string;
  category: string;
  description: string;
  price: string;
  unit: string;
  tags: string;
  accent: "blue" | "earth" | "mist";
  badge: string;
  ctaLabel: string;
  imageUrl: string;
  sortOrder: string;
  featured: boolean;
  quoteOnly: boolean;
  isActive: boolean;
};

const initialForm: ProductForm = {
  name: "",
  slug: "",
  category: "",
  description: "",
  price: "",
  unit: "",
  tags: "",
  accent: "blue",
  badge: "",
  ctaLabel: "",
  imageUrl: "",
  sortOrder: "0",
  featured: false,
  quoteOnly: false,
  isActive: true,
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function toForm(product: CmsProduct): ProductForm {
  return {
    name: product.name,
    slug: product.slug,
    category: product.category,
    description: product.description,
    price: String(product.price),
    unit: product.unit,
    tags: product.tags.join(", "),
    accent: product.accent,
    badge: product.badge ?? "",
    ctaLabel: product.ctaLabel ?? "",
    imageUrl: product.imageUrl ?? "",
    sortOrder: String(product.sortOrder ?? 0),
    featured: Boolean(product.featured),
    quoteOnly: Boolean(product.quoteOnly),
    isActive: product.isActive !== false,
  };
}

function normalizePayload(form: ProductForm) {
  const parsedPrice = Number(form.price);
  const parsedSortOrder = Number(form.sortOrder);

  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    category: form.category.trim(),
    description: form.description.trim(),
    price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
    unit: form.unit.trim(),
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    accent: form.accent,
    badge: form.badge.trim(),
    featured: form.featured,
    quoteOnly: form.quoteOnly,
    ctaLabel: form.ctaLabel.trim(),
    imageUrl: form.imageUrl.trim(),
    sortOrder: Number.isFinite(parsedSortOrder) ? parsedSortOrder : 0,
    isActive: form.isActive,
  };
}

type SuggestibleInputProps = {
  id: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  type?: string;
};

function SuggestibleInput({ id, value, onChange, options, placeholder, type = "text" }: SuggestibleInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!value) return options;
    return options.filter((opt) => opt.toLowerCase().includes(value.toLowerCase()));
  }, [options, value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % Math.max(filteredOptions.length, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % Math.max(filteredOptions.length, 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          onChange(filteredOptions[highlightedIndex]);
        }
        setIsOpen(false);
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          style={{ width: "100%", paddingRight: "2rem" }}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: "absolute",
            right: "0.5rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.6rem",
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.25rem",
            transform: isOpen ? "rotate(180deg)" : "none",
            transition: "transform 0.2s ease",
          }}
        >
          ▼
        </button>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--line)",
            borderRadius: "0.82rem",
            margin: "4px 0 0",
            padding: "0.4rem",
            listStyle: "none",
            maxHeight: "200px",
            overflowY: "auto",
            boxShadow: "var(--shadow)",
          }}
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              style={{
                padding: "0.6rem 0.8rem",
                borderRadius: "0.5rem",
                cursor: "pointer",
                backgroundColor: index === highlightedIndex ? "rgba(68, 172, 255, 0.12)" : "transparent",
                color: "var(--ink)",
                fontSize: "0.92rem",
                fontWeight: 500,
              }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type TagsInputProps = {
  id: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
};

function TagsInput({ id, value, onChange, options, placeholder }: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTags = useMemo(() => {
    return value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }, [value]);

  const filteredOptions = useMemo(() => {
    return options
      .filter((opt) => !selectedTags.includes(opt))
      .filter((opt) => opt.toLowerCase().includes(inputValue.toLowerCase()));
  }, [options, selectedTags, inputValue]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const cleanedTag = tag.trim();
    if (!cleanedTag) return;
    if (!selectedTags.includes(cleanedTag)) {
      const newTags = [...selectedTags, cleanedTag];
      onChange(newTags.join(", "));
    }
    setInputValue("");
    setHighlightedIndex(-1);
  };

  const removeTag = (tag: string) => {
    const newTags = selectedTags.filter((t) => t !== tag);
    onChange(newTags.join(", "));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        addTag(filteredOptions[highlightedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
      setIsOpen(false);
    } else if (e.key === "Backspace" && !inputValue && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev + 1) % Math.max(filteredOptions.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % Math.max(filteredOptions.length, 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => setIsOpen(true)}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.4rem",
          alignItems: "center",
          width: "100%",
          minHeight: "2.8rem",
          borderRadius: "0.82rem",
          padding: "0.4rem 0.6rem",
          background: "rgba(255, 255, 255, 0.9)",
          boxShadow: "inset 0 0 0 1px var(--line)",
          cursor: "text",
        }}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: "0.25rem 0.6rem",
              borderRadius: "999px",
              background: "rgba(68, 172, 255, 0.16)",
              color: "var(--ink)",
              fontSize: "0.85rem",
              fontWeight: 700,
            }}
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.8rem",
                color: "var(--muted)",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                fontWeight: "bold",
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : "Add tag..."}
          style={{
            border: 0,
            outline: 0,
            background: "transparent",
            boxShadow: "none",
            padding: "0.2rem 0",
            flex: 1,
            minWidth: "120px",
            fontSize: "0.95rem",
          }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.6rem",
            color: "var(--muted)",
            padding: "0.25rem",
            transform: isOpen ? "rotate(180deg)" : "none",
            transition: "transform 0.2s ease",
          }}
        >
          ▼
        </button>
      </div>

      {isOpen && (filteredOptions.length > 0 || inputValue.trim()) && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--line)",
            borderRadius: "0.82rem",
            margin: "4px 0 0",
            padding: "0.4rem",
            listStyle: "none",
            maxHeight: "200px",
            overflowY: "auto",
            boxShadow: "var(--shadow)",
          }}
        >
          {inputValue.trim() && !options.includes(inputValue.trim()) && (
            <li
              onClick={() => {
                addTag(inputValue);
                setIsOpen(false);
              }}
              style={{
                padding: "0.6rem 0.8rem",
                borderRadius: "0.5rem",
                cursor: "pointer",
                color: "var(--blue-deep)",
                fontSize: "0.92rem",
                fontWeight: 600,
                borderBottom: "1px solid var(--line)",
                marginBottom: "0.25rem",
              }}
            >
              ➕ Add "{inputValue.trim()}" as a new tag
            </li>
          )}
          {filteredOptions.map((option, index) => (
            <li
              key={option}
              onClick={() => {
                addTag(option);
                setIsOpen(false);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              style={{
                padding: "0.6rem 0.8rem",
                borderRadius: "0.5rem",
                cursor: "pointer",
                backgroundColor: index === highlightedIndex ? "rgba(68, 172, 255, 0.12)" : "transparent",
                color: "var(--ink)",
                fontSize: "0.92rem",
                fontWeight: 500,
              }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProductAdmin() {
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusState>({ type: "idle", message: "" });
  const [driveLink, setDriveLink] = useState("");

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  }, [products]);

  const units = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.unit).filter(Boolean)));
  }, [products]);

  const badges = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.badge ?? "").filter(Boolean)));
  }, [products]);

  const ctaLabels = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.ctaLabel ?? "").filter(Boolean)));
  }, [products]);

  const allTags = useMemo(() => {
    return Array.from(new Set(products.flatMap((p) => p.tags).filter(Boolean)));
  }, [products]);

  const slugs = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.slug).filter(Boolean)));
  }, [products]);

  function handleDriveConvert() {
    const match = driveLink.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
    if (!match) {
      setStatus({ type: "error", message: "Invalid Google Drive link. Please paste a full share URL." });
      return;
    }
    const fileId = match[1];
    const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    updateField("imageUrl", directUrl);
    setDriveLink("");
    setStatus({ type: "ok", message: "Google Drive image URL applied!" });
  }

  async function loadProducts() {
    try {
      setLoading(true);
      const response = await fetch("/api/products", { cache: "no-store" });
      const data = (await response.json()) as { products?: CmsProduct[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load products.");
      }

      setProducts(data.products ?? []);
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load products.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  function updateField<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setStatus({ type: "error", message: "File exceeds 2 MB size limit." });
      return;
    }

    setStatus({ type: "idle", message: "" });
    const formData = new FormData();
    formData.append("file", file);

    try {
      setStatus({ type: "idle", message: "Uploading image..." });
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Upload failed.");
      }

      updateField("imageUrl", data.imageUrl);
      setStatus({ type: "ok", message: "Image uploaded successfully!" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to upload image.",
      });
    }
  }

  function resetForm(message?: string) {
    setForm(initialForm);
    setEditingId(null);

    if (message) {
      setStatus({ type: "ok", message });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: "idle", message: "" });

    try {
      const payload = normalizePayload(form);

      if (!payload.name || !payload.category || !payload.description || !payload.unit || payload.tags.length === 0) {
        throw new Error("Please fill name, category, description, unit, and at least one tag.");
      }

      const endpoint = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { product?: CmsProduct; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save product.");
      }

      await loadProducts();
      resetForm(editingId ? "Product updated successfully." : "Product created successfully.");
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save product.",
      });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(product: CmsProduct) {
    setEditingId(product.id);
    setForm(toForm(product));
    setStatus({ type: "idle", message: "" });
  }

  async function handleDelete(product: CmsProduct) {
    const confirmed = window.confirm(`Delete ${product.name}? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(product.id);
      setStatus({ type: "idle", message: "" });

      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to delete product.");
      }

      if (editingId === product.id) {
        resetForm();
      }

      await loadProducts();
      setStatus({ type: "ok", message: "Product deleted successfully." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to delete product.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="cms-grid">
      <section className="panel">
        <h2>{isEditing ? "Edit product" : "Add product"}</h2>
        <p className="panel-note">Manage pricing, tags, image URL, and display settings in one place.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field" data-span="2">
            <label htmlFor="name">Product name</label>
            <input
              id="name"
              value={form.name}
              onChange={(event) => {
                const nameVal = event.target.value;
                updateField("name", nameVal);
                
                // Auto-generate slug if it's currently empty or if it matches the slugified version of the old name
                const oldSlugSuggested = form.name.toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "");
                
                if (!form.slug || form.slug === oldSlugSuggested) {
                  const newSlug = nameVal.toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");
                  updateField("slug", newSlug);
                }
              }}
              placeholder="Hind Jal Relief Pouch"
            />
          </div>

          <div className="field">
            <label htmlFor="slug">Slug (optional)</label>
            <SuggestibleInput
              id="slug"
              value={form.slug}
              onChange={(val) => updateField("slug", val)}
              options={slugs}
              placeholder="relief-pouch"
            />
          </div>

          <div className="field">
            <label htmlFor="category">Category</label>
            <SuggestibleInput
              id="category"
              value={form.category}
              onChange={(val) => updateField("category", val)}
              options={categories}
              placeholder="Everyday relief"
            />
          </div>

          <div className="field" data-span="2">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="description">Description</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    updateField("description", e.target.value);
                    e.target.value = ""; // Reset selection
                  }
                }}
                style={{
                  width: "auto",
                  padding: "0.25rem 0.6rem",
                  fontSize: "0.76rem",
                  borderRadius: "0.5rem",
                  background: "rgba(255, 255, 255, 0.9)",
                  border: "1px solid var(--line)",
                  cursor: "pointer",
                  color: "var(--muted)",
                  outline: "none",
                }}
              >
                <option value="">📝 Use a description template...</option>
                <option value="A fast, affordable pouch for immediate hydration and everyday relief on the go.">💧 Hydration Pouch</option>
                <option value="Premium purified drinking water, processed with multi-stage filtration for pristine taste and health.">💎 Premium Purified</option>
                <option value="Pocket-friendly and lightweight pouch, perfect for quick hydration at outdoor events, retail, or travel.">🌱 Eco & Event Friendly</option>
                <option value="Convenient bulk hydration solution designed for corporate offices, events, and residential storage.">📦 Bulk Event Pack</option>
              </select>
            </div>
            <textarea
              id="description"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="A fast, affordable pouch for immediate hydration..."
            />
          </div>

          <div className="field">
            <label htmlFor="price">Price (INR)</label>
            <input
              id="price"
              type="number"
              min={0}
              value={form.price}
              onChange={(event) => updateField("price", event.target.value)}
              placeholder="5"
            />
          </div>

          <div className="field">
            <label htmlFor="unit">Unit</label>
            <SuggestibleInput
              id="unit"
              value={form.unit}
              onChange={(val) => updateField("unit", val)}
              options={units}
              placeholder="per pouch"
            />
          </div>

          <div className="field" data-span="2">
            <label htmlFor="tags">Tags</label>
            <TagsInput
              id="tags"
              value={form.tags}
              onChange={(val) => updateField("tags", val)}
              options={allTags}
              placeholder="250 ml, Pocket-friendly, Retail-ready"
            />
          </div>

          <div className="field">
            <label htmlFor="accent">Accent</label>
            <select id="accent" value={form.accent} onChange={(event) => updateField("accent", event.target.value as ProductForm["accent"])}>
              <option value="blue">Blue</option>
              <option value="earth">Earth</option>
              <option value="mist">Mist</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="sortOrder">Sort order</label>
            <input
              id="sortOrder"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(event) => updateField("sortOrder", event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="badge">Badge (optional)</label>
            <SuggestibleInput
              id="badge"
              value={form.badge}
              onChange={(val) => updateField("badge", val)}
              options={badges}
              placeholder="Best value"
            />
          </div>

          <div className="field">
            <label htmlFor="ctaLabel">CTA Label</label>
            <SuggestibleInput
              id="ctaLabel"
              value={form.ctaLabel}
              onChange={(val) => updateField("ctaLabel", val)}
              options={ctaLabels}
              placeholder="Order pouch"
            />
          </div>

          <div className="field" data-span="2">
            <label htmlFor="imageUrl">Image URL</label>
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
              <input
                id="imageUrl"
                value={form.imageUrl}
                onChange={(event) => updateField("imageUrl", event.target.value)}
                placeholder="https://..."
                style={{ flex: 1 }}
              />
              <label 
                className="btn btn--ghost" 
                style={{ 
                  margin: 0, 
                  cursor: "pointer", 
                  whiteSpace: "nowrap", 
                  padding: "0.9rem 1.25rem", 
                  fontSize: "0.95rem" 
                }}
              >
                Upload File
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>
              Direct URL or upload a file under 2 MB.
            </p>

            {/* ── Google Drive link converter ── */}
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", marginTop: "0.75rem" }}>
              <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                <span style={{
                  position: "absolute",
                  left: "0.85rem",
                  fontSize: "1rem",
                  pointerEvents: "none",
                  userSelect: "none",
                  lineHeight: 1,
                }}>📁</span>
                <input
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  placeholder="Paste Google Drive share link..."
                  style={{ flex: 1, paddingLeft: "2.4rem" }}
                />
              </div>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleDriveConvert}
                disabled={!driveLink.trim()}
                style={{ whiteSpace: "nowrap", padding: "0.9rem 1.25rem", fontSize: "0.95rem" }}
              >
                Use Drive Link
              </button>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>
              In Google Drive: right-click → Share → "Anyone with the link" → copy link and paste above.
            </p>
          </div>

          <div className="field-row">
            <input
              id="featured"
              type="checkbox"
              checked={form.featured}
              onChange={(event) => updateField("featured", event.target.checked)}
            />
            <span>Featured product</span>
          </div>

          <div className="field-row">
            <input
              id="quoteOnly"
              type="checkbox"
              checked={form.quoteOnly}
              onChange={(event) => updateField("quoteOnly", event.target.checked)}
            />
            <span>Quote only</span>
          </div>

          <div className="field-row">
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateField("isActive", event.target.checked)}
            />
            <span>Visible on storefront</span>
          </div>

          <div className="field" />

          {form.imageUrl ? (
            <div className="field" data-span="2">
              {/* CMS image hosts are user-defined at runtime, so dynamic img tags are intentional. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Preview" className="product-image" src={form.imageUrl} />
            </div>
          ) : null}

          <div className="field" data-span="2">
            <div className="form-actions">
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : isEditing ? "Update product" : "Create product"}
              </button>
              <button className="btn btn--ghost" type="button" onClick={() => resetForm()} disabled={saving}>
                Clear form
              </button>
            </div>
          </div>
        </form>

        {status.type !== "idle" ? (
          <div className={`status ${status.type === "ok" ? "status--ok" : "status--error"}`}>{status.message}</div>
        ) : null}
      </section>

      <section className="panel">
        <h2>Current products</h2>
        <p className="panel-note">Products here are the live records used by the storefront.</p>

        {loading ? <p className="panel-note">Loading products...</p> : null}

        {!loading && products.length === 0 ? <p className="panel-note">No products found yet.</p> : null}

        <div className="product-list">
          {products.map((product) => (
            <article className="product-item" key={product.id}>
              <div className="product-top">
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.category}</p>
                </div>
                <div className="product-price">{product.quoteOnly ? "Quote" : formatCurrency(product.price)}</div>
              </div>

              {product.imageUrl ? (
                <>
                  {/* CMS image hosts are user-defined at runtime, so dynamic img tags are intentional. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={product.name} className="product-image" src={product.imageUrl} />
                </>
              ) : null}

              <p className="panel-note" style={{ marginTop: "0.5rem" }}>
                {product.description}
              </p>

              <div className="chips">
                {product.tags.map((tag) => (
                  <span key={`${product.id}-${tag}`}>{tag}</span>
                ))}
              </div>

              <div className="chips" style={{ marginTop: "0.45rem" }}>
                <span>{product.unit}</span>
                <span>{product.accent}</span>
                <span>{product.featured ? "featured" : "standard"}</span>
                <span>{product.isActive ? "visible" : "hidden"}</span>
              </div>

              <div className="product-actions">
                <button className="btn btn--ghost" type="button" onClick={() => startEdit(product)}>
                  Edit
                </button>
                <button
                  className="btn btn--earth"
                  type="button"
                  disabled={deletingId === product.id}
                  onClick={() => handleDelete(product)}
                >
                  {deletingId === product.id ? "Removing..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
