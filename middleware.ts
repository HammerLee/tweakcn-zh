import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { API_AUTH_PREFIX, DEFAULT_LOGIN_REDIRECT } from "./routes";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 离线本地版没有登录态：编辑器路由直接放行。
  // 早先这里对 /editor/theme/:themeId 也查 session，会强制走一次数据库/网络请求，
  // 在断网机器上要么挂住要么整页报错。
  if (pathname.startsWith("/editor") || pathname.startsWith(API_AUTH_PREFIX)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.url));
  }

  // Redirect logged-in users from /dashboard or /settings (root) to /settings/themes
  if (pathname === "/dashboard" || pathname === "/settings") {
    return NextResponse.redirect(new URL("/settings/themes", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/settings/:path*", "/success"],
};
