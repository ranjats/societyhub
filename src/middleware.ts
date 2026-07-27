import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

interface JWTPayload {
  role?: string;
  societyId?: string;
  residentId?: string;
  id?: string;
  [key: string]: unknown;
}

const publicPaths = ["/login", "/signup", "/api/auth"];
const unauthorizedPath = "/unauthorized";

// Role-based route access rules
const roleRouteAccess: Record<string, string[]> = {
  COMMITTEE_MEMBER: [
    "/dashboard", "/residents", "/flats", "/collections", "/expenses",
    "/events", "/notices", "/assets", "/calendar", "/vehicles",
    "/reports", "/notifications", "/users", "/settings", "/profile", "/payments",
  ],
  RESIDENT: [
    "/dashboard", "/profile", "/payments", "/events", "/notices",
    "/calendar", "/vehicles", "/notifications",
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files and next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow unauthorized page
  if (pathname === unauthorizedPath) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  // Redirect to login if no token
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based route access
  const role = (token as JWTPayload).role;
  if (!role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const allowedRoutes = roleRouteAccess[role] || [];

  // Check if the path starts with any allowed route
  const isAllowed = allowedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));

  if (!isAllowed) {
    const unauthorizedUrl = new URL(unauthorizedPath, request.url);
    unauthorizedUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
