// app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token e senha são obrigatórios' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    }

    // Verificar se o token existe e não expirou
    // Primeiro, hashear o token recebido para comparar com o armazenado
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(), // Token ainda válido (não expirou)
        },
      },
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'Token inválido ou expirado' 
      }, { status: 400 });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Atualizar a senha e limpar o token de reset
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ 
      message: 'Senha redefinida com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Verificar se o token é válido
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 });
    }

    // Hashear o token para comparar com o armazenado
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Verificar se o token existe e não expirou
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json({ 
        valid: false,
        error: 'Token inválido ou expirado' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      valid: true,
      email: user.email,
      name: user.name 
    });

  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
