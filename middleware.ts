import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Lista de rotas públicas que não precisam de autenticação
const publicRoutes = [
  "/login",
  "/sign-up",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
]

export async function middleware(request: NextRequest) {
  // Ignorar rotas de API, arquivos estáticos e recursos do Next.js
  if (
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.includes(".") ||
    request.nextUrl.pathname.startsWith("/public") ||
    request.nextUrl.pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    // Se for a página de reset-password, verificar se tem o token na URL
    if (request.nextUrl.pathname.startsWith("/reset-password")) {
      const resetToken = request.nextUrl.searchParams.get("token")
      if (!resetToken) {
        return NextResponse.redirect(new URL("/login", request.url))
      }
      return NextResponse.next()
    }

    // Redirecionar usuários autenticados das páginas públicas para /conta
    if (isPublicRoute && token) {
      return NextResponse.redirect(new URL("/conta", request.url))
    }

    // Permitir acesso a rotas públicas
    if (isPublicRoute) {
      return NextResponse.next()
    }

    // Redirecionar usuários não autenticados para login
    if (!token) {
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Erro no middleware:", error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
