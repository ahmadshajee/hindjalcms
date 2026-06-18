import { NextResponse, NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, api/auth paths, and login page
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("cms_session")?.value;

  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.redirect(new NextUrl("/login", request.url));
  }

  const payload = await verifySession(token);
  console.log("Middleware token:", token);
  console.log("Middleware payload:", payload);

  if (!payload) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    // Clear cookie and redirect
    const response = NextResponse.redirect(new NextUrl("/login", request.url));
    response.cookies.delete("cms_session");
    return response;
  }

  return NextResponse.next();
}

// Help NextUrl resolution if TypeScript complaining
class NextUrl extends URL {
  constructor(path: string, base: string) {
    super(path, base);
  }
}
