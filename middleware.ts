// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isTokenExpired, getTokenPayload } from '@/lib/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas que não precisam de autenticação
  const publicRoutes = ['/login', '/cadastro', '/reset-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Apenas redirecionar a raiz para home
  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/home', request.url));
  }

  // Se é rota pública, permitir acesso
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Verificar autenticação para rotas protegidas
  const token = request.cookies.get('authToken')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verificar se token expirou
  if (isTokenExpired(token)) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('authToken');
    return response;
  }

  // Extrair payload do token
  try {
    const payload = getTokenPayload(token);
    if (!payload?.userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verificar status da assinatura apenas para rotas da aplicação (não API)
    if (!pathname.startsWith('/api') && !pathname.startsWith('/planos')) {
      try {
        // Fazer verificação do status da assinatura
        const baseUrl = request.nextUrl.origin;
        const subscriptionResponse = await fetch(`${baseUrl}/api/teams/subscription-status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          
          // Se a assinatura expirou e é trial, redirecionar para página de planos
          if (subscriptionData.isTrial && subscriptionData.isExpired) {
            return NextResponse.redirect(new URL('/planos?expired=true', request.url));
          }
          
          // Se não pode acessar (outros motivos), também redirecionar
          if (!subscriptionData.canAccess) {
            return NextResponse.redirect(new URL('/planos?blocked=true', request.url));
          }
        } else {
          // Em caso de erro na verificação de subscription, permitir acesso
        }
      } catch (error) {
        // Em caso de erro na verificação, permitir acesso
      }
    }

  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Para todas as outras rotas autenticadas, permitir acesso
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes that handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
}