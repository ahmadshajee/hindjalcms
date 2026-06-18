import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Validate size (under 2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds the 2MB limit." }, { status: 400 });
    }

    // Validate type (must be image)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
    }

    // Generate unique name
    const ext = path.extname(file.name) || ".png";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Define target directories
    const storefrontUploadsDir = path.join(process.cwd(), "..", "public", "uploads");
    const cmsUploadsDir = path.join(process.cwd(), "public", "uploads");

    // Ensure directories exist
    await fs.mkdir(storefrontUploadsDir, { recursive: true });
    await fs.mkdir(cmsUploadsDir, { recursive: true });

    // Write to both storefront and CMS public folders
    await fs.writeFile(path.join(storefrontUploadsDir, uniqueName), buffer);
    await fs.writeFile(path.join(cmsUploadsDir, uniqueName), buffer);

    return NextResponse.json({ imageUrl: `/uploads/${uniqueName}` });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Internal server error during upload." }, { status: 500 });
  }
}
