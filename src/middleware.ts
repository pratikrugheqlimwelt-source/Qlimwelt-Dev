import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Supabase may redirect to Site URL with ?code= on / instead of /auth/callback
  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/login",
    "/onboarding",
    "/auth/:path*",
  ],
};
