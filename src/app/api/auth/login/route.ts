import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const expectedEmail = process.env.ADMIN_EMAIL || "admin@test.com";
    const expectedPassword = process.env.ADMIN_PASSWORD || "pass123";

    if (email === expectedEmail && password === expectedPassword) {
      const token = await signSession({
        email,
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      });

      const cookieStore = await cookies();
      cookieStore.set("cms_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
