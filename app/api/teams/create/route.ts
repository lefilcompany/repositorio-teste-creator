import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createTeamSubscription } from '@/lib/subscription-utils';

export async function POST(req: Request) {
  const { userId, name, code, credits } = await req.json();
  try {
    // Buscar plano FREE como padrão para novos teams
    const freePlan = await prisma.plan.findFirst({
      where: { name: 'FREE' }
    });

    if (!freePlan) {
      return NextResponse.json({ error: 'Free plan not found' }, { status: 500 });
    }

    // Criptografar o código da equipe
    const hashedCode = await bcrypt.hash(code, 12);
    
    // Verificar se já existe uma equipe com o mesmo nome (não podemos mais verificar por código hasheado)
    const existingTeam = await prisma.team.findFirst({ 
      where: { 
        OR: [
          { name: { equals: name, mode: 'insensitive' } }
        ]
      } 
    });
    
    if (existingTeam) {
      return NextResponse.json({ error: 'Team name already exists' }, { status: 400 });
    }
    
    const team = await prisma.team.create({
      data: {
        name,
        code: hashedCode, // Código criptografado para verificação
        displayCode: code, // Código original para exibição
        adminId: userId,
        currentPlanId: freePlan.id, // Definir plano FREE por padrão
        members: {
          connect: { id: userId },
        },
      },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { teamId: team.id, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    });

    // Criar assinatura FREE com trial de 14 dias
    const subscription = await createTeamSubscription(team.id, 'FREE');

    if (!subscription) {
      return NextResponse.json({ error: 'Falha ao configurar assinatura inicial' }, { status: 500 });
    }

    return NextResponse.json(team);
  } catch (error) {
    return NextResponse.json({ error: 'Team creation failed' }, { status: 500 });
  }
}

