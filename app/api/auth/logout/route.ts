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
          // Finalizar sessões ativas do usuário
          const activeSessions = await prisma.usageSession.findMany({
            where: {
              userId: payload.userId,
              active: true,
              logoutTime: null
            }
          });

          if (activeSessions.length > 0) {
            const logoutTime = new Date();
            
            // Atualizar todas as sessões ativas
            for (const session of activeSessions) {
              const currentSegmentDuration = Math.floor((logoutTime.getTime() - session.loginTime.getTime()) / 1000);
              
              await prisma.usageSession.update({
                where: { id: session.id },
                data: {
                  logoutTime,
                  duration: currentSegmentDuration,
                  active: false,
                  sessionType: 'logout'
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('Erro ao finalizar sessões de uso no logout:', error);
        // Continua com logout mesmo se houver erro no tracking
      }
    }
    
    return NextResponse.json({ 
      message: 'Logout realizado com sucesso',
      success: true 
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

