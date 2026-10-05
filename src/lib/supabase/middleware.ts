import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Vercel Edge middleware budget is tight; never wait on Supabase forever. */
const SUPABASE_TIMEOUT_MS = 4_000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("SUPABASE_TIMEOUT")), ms);
    Promise.resolve(promise).then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

/** True when the request may have a Supabase session cookie. */
function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.delete("seed");
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === "/login" || pathname.startsWith("/auth/");
  const isOnboarding = pathname === "/onboarding";
  const isDashboard = pathname.startsWith("/dashboard");
  const isQaiMobile = pathname.startsWith("/qai-mobile");
  const isProtectedApp = isDashboard || isQaiMobile;
  const needsUser = isProtectedApp || isOnboarding || isAuthRoute;

  // Public marketing `/` (and any other non-auth path): skip network if no session cookie.
  // This prevents MIDDLEWARE_INVOCATION_TIMEOUT when Auth/DB is slow.
  if (!needsUser && !hasSupabaseAuthCookie(request)) {
    return supabaseResponse;
  }

  // No cookie on protected routes → login immediately (no Supabase round-trip).
  if (isProtectedApp && !hasSupabaseAuthCookie(request)) {
    const seedQuery = request.nextUrl.searchParams.get("seed") === "1";
    const seedCookie = request.cookies.get("qlimwelt_dev_seed")?.value === "1";
    if (process.env.NODE_ENV === "development" && isDashboard && (seedQuery || seedCookie)) {
      if (seedQuery) {
        supabaseResponse.cookies.set("qlimwelt_dev_seed", "1", {
          path: "/",
          sameSite: "lax",
          httpOnly: false,
          maxAge: 60 * 60 * 8,
        });
      }
      return supabaseResponse;
    }
    return redirectToLogin(request, pathname);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user: { id: string } | null = null;
  try {
    const result = await withTimeout(supabase.auth.getUser(), SUPABASE_TIMEOUT_MS);
    user = result.data.user;
  } catch {
    // Auth hung or failed — fail closed on protected routes, open on public/login.
    if (isProtectedApp || isOnboarding) {
      return redirectToLogin(request, pathname);
    }
    return supabaseResponse;
  }

  if (!user && (isProtectedApp || isOnboarding)) {
    const seedQuery = request.nextUrl.searchParams.get("seed") === "1";
    const seedCookie = request.cookies.get("qlimwelt_dev_seed")?.value === "1";
    if (process.env.NODE_ENV === "development" && isDashboard && (seedQuery || seedCookie)) {
      if (seedQuery) {
        supabaseResponse.cookies.set("qlimwelt_dev_seed", "1", {
          path: "/",
          sameSite: "lax",
          httpOnly: false,
          maxAge: 60 * 60 * 8,
        });
      }
      return supabaseResponse;
    }
    return redirectToLogin(request, pathname);
  }

  if (user) {
    let onboardingDone = false;
    try {
      const { data: profile } = await withTimeout(
        supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle(),
        SUPABASE_TIMEOUT_MS
      );
      onboardingDone = profile?.onboarding_completed === true;
    } catch {
      // Profile lookup timed out — don't block forever; send to dashboard if already past login.
      if (isProtectedApp) return supabaseResponse;
      if (pathname === "/login" || isOnboarding) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/overview";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    if (isProtectedApp && !onboardingDone) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if ((pathname === "/login" || isOnboarding) && onboardingDone) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/overview";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
