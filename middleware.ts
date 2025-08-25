// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apenas redirecionar a raiz para home
  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/home', request.url));
  }

  // Para todas as outras rotas, deixar passar
  // A autenticação será gerenciada pelo layout e useAuth
  return NextResponse.next();
}

export const config = {
  // Matcher atualizado para ser mais específico
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets)
     * - login and cadastro (auth pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets|login|cadastro).*)',
  ],
}