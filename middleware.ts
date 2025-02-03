import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuthPage = request.nextUrl.pathname.startsWith("/login") || 
                     request.nextUrl.pathname.startsWith("/sign-up") ||
                     request.nextUrl.pathname.startsWith("/verify-email")

  if (isAuthPage) {
    if (token) {
      return NextResponse.redirect(new URL("/conta", request.url))
    }
    return NextResponse.next()
  }

  if (!token) {
    let redirectUrl = new URL("/login", request.url)
    
    if (!request.nextUrl.pathname.startsWith("/verify-email")) {
      redirectUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    }
    
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
