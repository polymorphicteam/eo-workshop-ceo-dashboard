import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, SESSION_DAYS, safeEqual, sessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const supplied = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const expected = process.env.DASHBOARD_PASSWORD ?? "";

  if (!expected || !safeEqual(supplied, expected)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?error=1${safeNext !== "/" ? `&next=${encodeURIComponent(safeNext)}` : ""}`;
    return NextResponse.redirect(url, 303);
  }

  const url = req.nextUrl.clone();
  url.pathname = safeNext;
  url.search = "";
  const res = NextResponse.redirect(url, 303);
  res.cookies.set(COOKIE_NAME, await sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}
