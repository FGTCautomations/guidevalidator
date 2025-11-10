import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { defaultLocale, locales, type SupportedLocale } from "./i18n/config";
import { createServerClient } from "@supabase/ssr";

const intlMiddleware = createIntlMiddleware({
  defaultLocale,
  locales,
  localeDetection: true,
});

const PROTECTED_PATHS = ["/directory", "/jobs", "/account", "/bookings", "/availability"];
const PUBLIC_PATHS = ["/auth", "/pricing", "/about", "/contact", "/advertising"];

// Anti-scraping bot detection
const BOT_USER_AGENTS = [
  'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python',
  'scrapy', 'beautifulsoup', 'selenium', 'puppeteer', 'playwright',
  'headless', 'phantom', 'mechanize', 'httpie', 'scrapy', 'node-fetch',
  'axios', 'got', 'superagent', 'request', 'httpclient'
];

// Rate limiting: Track requests per IP (use Redis in production)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.ip ||
         'unknown';
}

function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

function isSuspiciousRequest(req: NextRequest): boolean {
  const userAgent = req.headers.get('user-agent')?.toLowerCase() || '';

  // No user agent is very suspicious
  if (!userAgent) {
    return true;
  }

  // Check for bot user agents
  if (BOT_USER_AGENTS.some(bot => userAgent.includes(bot))) {
    return true;
  }

  // Check for missing common browser headers
  const hasAccept = req.headers.get('accept');
  const hasAcceptLanguage = req.headers.get('accept-language');
  const hasAcceptEncoding = req.headers.get('accept-encoding');

  // Real browsers always send these headers
  if (!hasAccept || !hasAcceptLanguage || !hasAcceptEncoding) {
    return true;
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // Anti-scraping: Check for bots on directory and profile pages
  if (pathname.includes('/directory') || pathname.includes('/profile')) {
    // Check rate limiting (100 requests per minute per IP)
    if (!checkRateLimit(ip, 100, 60000)) {
      console.log(`[Anti-Scraping] Rate limit exceeded for IP: ${ip} on ${pathname}`);
      return new NextResponse('Too Many Requests - Please slow down', {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
        },
      });
    }

    // Check for suspicious bot behavior
    if (isSuspiciousRequest(request)) {
      console.log(`[Anti-Scraping] Suspicious request blocked from IP: ${ip}, User-Agent: ${request.headers.get('user-agent')} on ${pathname}`);
      return new NextResponse('Access Denied - Automated access is not permitted', {
        status: 403,
        headers: {
          'X-Robots-Tag': 'noindex, nofollow',
        },
      });
    }
  }

  // Run intl middleware first
  const intlResponse = intlMiddleware(request);

  // Extract locale from pathname
  const pathnameLocale = pathname.split("/")[1];
  const locale: SupportedLocale = locales.includes(pathnameLocale as SupportedLocale)
    ? (pathnameLocale as SupportedLocale)
    : defaultLocale;
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

  // Allow homepage and public paths
  if (pathWithoutLocale === "/" || PUBLIC_PATHS.some((path) => pathWithoutLocale.startsWith(path))) {
    return intlResponse;
  }

  // Check if path is protected
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathWithoutLocale.startsWith(path));

  if (!isProtectedPath) {
    return intlResponse;
  }

  // Create Supabase client
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to preview page if accessing protected content without authentication
  if (!user) {
    if (pathWithoutLocale.startsWith("/directory") && !pathWithoutLocale.startsWith("/directory/preview")) {
      return NextResponse.redirect(new URL(`/${locale}/directory/preview`, request.url));
    }
    if (pathWithoutLocale.startsWith("/jobs") && !pathWithoutLocale.startsWith("/jobs/preview")) {
      return NextResponse.redirect(new URL(`/${locale}/jobs/preview`, request.url));
    }
    return NextResponse.redirect(new URL(`/${locale}/auth/sign-in`, request.url));
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded, role")
    .eq("id", user.id)
    .single();

  // If profile not complete, redirect to onboarding (except if already on onboarding page)
  if (profile && !profile.onboarded && !pathWithoutLocale.startsWith("/account/onboarding")) {
    return NextResponse.redirect(new URL(`/${locale}/account/onboarding`, request.url));
  }

  // Check subscription for roles that require it
  if (profile && ["agency", "dmc"].includes(profile.role)) {
    const { data: billingCustomer } = await supabase
      .from("billing_customers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    let hasActiveSubscription = false;
    if (billingCustomer) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("billing_customer_id", billingCustomer.id)
        .in("status", ["active", "trialing"])
        .maybeSingle();

      hasActiveSubscription = subscription !== null;
    }

    // If no active subscription, redirect to billing page (except if already on billing/pricing)
    if (!hasActiveSubscription && !pathWithoutLocale.startsWith("/account/billing") && !pathWithoutLocale.startsWith("/pricing")) {
      return NextResponse.redirect(new URL(`/${locale}/account/billing`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/((?!api|_next/static|_next/image|favicon.ico|videos|images|media|assets).*)",
  ],
};

