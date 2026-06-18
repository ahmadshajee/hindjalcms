# Hindjal CMS portal

Standalone CMS website for managing Hind Jal product data in MongoDB.

## Features

- Add, edit, and delete products
- Manage price, tags, image URL, CTA text, and display order
- Product records are stored in MongoDB and consumed by the storefront

## Run locally

```bash
npm install
npm run dev
```

## Environment variables

Set these values in `.env.local`:

- `MONGODB_URI`
- `MONGODB_DB`
