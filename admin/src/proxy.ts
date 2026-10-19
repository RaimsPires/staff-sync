import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth-cookie";

/** Sends signed-out visitors to the sign-in page before any dashboard page renders. */
export function proxy(request: NextRequest) {
  if (request.cookies.has(AUTH_COOKIE)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/live/:path*", "/attendance/:path*", "/alerts/:path*", "/employees/:path*", "/sites/:path*", "/schedules/:path*", "/leave/:path*", "/reports/:path*", "/users/:path*", "/audit/:path*", "/settings/:path*", "/profile/:path*"],
};
