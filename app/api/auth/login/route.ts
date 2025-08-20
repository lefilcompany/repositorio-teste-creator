import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createJWT } from '@/lib/jwt';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Verificar senha com bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    if (user.status === 'INACTIVE') {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
    }
    
    // Usuários com PENDING ainda aguardando aprovação para equipe
    if (user.status === 'PENDING') {
      return NextResponse.json({ status: 'pending' }, { status: 403 });
    }

    // Usuários com NO_TEAM precisam escolher equipe
    if (user.status === 'NO_TEAM') {
      const { password: _pw, ...safeUser } = user;
      return NextResponse.json({ status: 'no_team', user: safeUser }, { status: 200 });
    }

    // Criar JWT token para usuários ativos
    const token = await createJWT({
      userId: user.id,
      email: user.email,
      teamId: user.teamId,
      role: user.role,
      status: user.status,
    });

    const { password: _pw, ...safeUser } = user;
    return NextResponse.json({
      user: safeUser,
      token,
      message: 'Login realizado com sucesso'
    });
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
