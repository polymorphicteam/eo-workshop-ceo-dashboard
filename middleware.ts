import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, isValidSession, passwordEnabled } from "@/lib/auth";

/**
 * Sends anyone without a valid session cookie to /login.
 * See lib/auth.ts for how the password and cookie work.
 */
export async function middleware(req: NextRequest) {
  if (!passwordEnabled()) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname === "/login" || pathname.startsWith("/api/login") || pathname.startsWith("/api/logout")) {
    return NextResponse.next();
  }

  if (await isValidSession(req.cookies.get(COOKIE_NAME)?.value)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
  return NextResponse.redirect(url);
}

export const config = {
  // Protect everything except Next's own static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
