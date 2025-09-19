import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createJWT } from '@/lib/jwt';

export async function POST(req: Request) {
  const { email, password, rememberMe } = await req.json();
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

    // Criar JWT token para usuários ativos com duração baseada em rememberMe
    const token = await createJWT({
      userId: user.id,
      email: user.email,
      teamId: user.teamId,
      role: user.role,
      status: user.status,
    }, rememberMe === true);

    console.log(`✅ Login realizado com sucesso: ${user.email}`);

    const { password: _pw, ...safeUser } = user;
    
    // Criar resposta com token
    const response = NextResponse.json({
      user: safeUser,
      token,
      message: 'Login realizado com sucesso'
    });

    // Definir cookie para o middleware
    response.cookies.set('authToken', token, {
      httpOnly: false, // Permite acesso via JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 dias ou 1 dia
      path: '/'
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

