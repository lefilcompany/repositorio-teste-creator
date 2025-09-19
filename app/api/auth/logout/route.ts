// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    // Tentar obter o token do cabeçalho
    const authHeader = req.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = await verifyJWT(token);
        
        if (payload?.userId) {
          console.log(`✅ Logout realizado para usuário: ${payload.userId}`);
        }
      } catch (error) {
        console.error('Erro ao processar logout:', error);
      }
    }
    
    // Criar resposta de logout
    const response = NextResponse.json({ 
      message: 'Logout realizado com sucesso',
      success: true 
    });

    // Limpar cookie de autenticação
    response.cookies.delete('authToken');

    return response;
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

