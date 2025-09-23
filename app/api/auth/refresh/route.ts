// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, createJWT, getTokenPayload } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { token, rememberMe = false } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 });
    }

    // Verificar se o token ainda é válido
    let payload;
    try {
      payload = await verifyJWT(token);
    } catch (error) {
      // Se o token expirou recentemente (menos de 5 minutos), ainda permitir renovação
      const tokenPayload = getTokenPayload(token);
      if (!tokenPayload || !tokenPayload.exp) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
      }

      const now = Math.floor(Date.now() / 1000);
      const gracePeríod = 5 * 60; // 5 minutos de graça
      
      if (tokenPayload.exp < (now - gracePeríod)) {
        return NextResponse.json({ error: 'Token expirado há muito tempo' }, { status: 401 });
      }

      payload = tokenPayload;
    }

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Buscar dados atualizados do usuário
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        team: {
          include: {
            currentPlan: true, // Incluir currentPlan
            members: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Usuário inativo' }, { status: 403 });
    }

    // Criar novo token com dados atualizados
    const newToken = await createJWT({
      userId: user.id,
      email: user.email,
      teamId: user.teamId,
      role: user.role,
      status: user.status
    }, rememberMe);

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      teamId: user.teamId,
      role: user.role,
      status: user.status,
      team: user.team ? {
        id: user.team.id,
        name: user.team.name,
        displayCode: user.team.displayCode,
        plan: user.team.currentPlan, // Usar currentPlan em vez de plan
        members: user.team.members
      } : null
    };

    return NextResponse.json({ 
      token: newToken, 
      user: userData,
      message: 'Token renovado com sucesso'
    });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

