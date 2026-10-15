import { NextResponse, type NextRequest } from "next/server";

/**
 * Password protection for the whole dashboard.
 *
 * Set DASHBOARD_PASSWORD in .env.local (and in Vercel -> Settings -> Environment
 * Variables). The browser will prompt for a username and password; the username
 * is ignored, the password must match. Leave it unset to run without a login
 * (useful on localhost); the page footer will remind you it's open.
 *
 * This is HTTP Basic Auth over HTTPS: fine for keeping a KPI page off the open
 * internet, not a substitute for real user accounts.
 */
export function middleware(req: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return NextResponse.next();

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const supplied = decoded.slice(decoded.indexOf(":") + 1);
      if (supplied === password) return NextResponse.next();
    } catch {
      // fall through to the 401
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="KPI Dashboard", charset="UTF-8"' },
  });
}

export const config = {
  // Protect everything except Next's own static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
