import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const data = await req.json();
  try {
    // Hash da senha antes de salvar
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    
    // Se existe um usuário com este email
    if (existing) {
      // Se a conta está inativa, permitir reativação
      if (existing.status === UserStatus.INACTIVE) {
        const reactivatedUser = await prisma.user.update({
          where: { email: data.email },
          data: {
            name: data.name,
            password: hashedPassword,
            phone: data.phone,
            state: data.state,
            city: data.city,
            status: UserStatus.ACTIVE,
          },
        });
        
        return NextResponse.json({ 
          ...reactivatedUser, 
          message: 'Conta reativada com sucesso!' 
        });
      }
      
      // Se a conta está ativa ou pendente, retornar erro
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    // Criar nova conta normalmente
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        state: data.state,
        city: data.city,
        status: UserStatus.NO_TEAM,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Register error', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
