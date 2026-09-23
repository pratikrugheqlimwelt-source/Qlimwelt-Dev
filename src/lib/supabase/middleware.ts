import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === "/login" || pathname.startsWith("/auth/");
  const isOnboarding = pathname === "/onboarding";
  const isDashboard = pathname.startsWith("/dashboard");
  const isQaiMobile = pathname.startsWith("/qai-mobile");
  const isProtectedApp = isDashboard || isQaiMobile;

  if (!user && (isProtectedApp || isOnboarding)) {
    // Dev-only: ?seed=1 (and a cookie so tab switches keep working without the query).
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
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.delete("seed");
    if (isProtectedApp) {
      url.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    const onboardingDone = profile?.onboarding_completed === true;

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

    if (isOnboarding && !onboardingDone) {
      return supabaseResponse;
    }
  }

  if (user && pathname === "/login") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    const url = request.nextUrl.clone();
    url.pathname = profile?.onboarding_completed ? "/dashboard/overview" : "/onboarding";
    return NextResponse.redirect(url);
  }

  if (isAuthRoute) {
    return supabaseResponse;
  }

  return supabaseResponse;
}
