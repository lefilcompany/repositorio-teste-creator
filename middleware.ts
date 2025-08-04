// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // O matcher continua o mesmo
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|login|cadastro).*)',
  ],
}