// app/api/auth/complete-login/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createJWT } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    const { userId, rememberMe } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    // Buscar usuário atualizado
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Usuário não está ativo' }, { status: 403 });
    }

    // Criar JWT token com duração baseada em rememberMe
    const token = await createJWT({
      userId: user.id,
      email: user.email,
      teamId: user.teamId,
      role: user.role,
      status: user.status,
    }, rememberMe === true);

    const { password: _pw, ...safeUser } = user;
    
    return NextResponse.json({
      user: safeUser,
      token,
      message: 'Login completado com sucesso'
    });

  } catch (error) {
    console.error('Complete login error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
