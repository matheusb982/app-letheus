export const runtime = "nodejs";

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/((?!api/auth|login|register|forgot-password|terms|privacy|_next/static|_next/image|favicon.ico).*)",
  ],
};
