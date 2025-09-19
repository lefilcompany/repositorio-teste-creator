import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { buildPlanSnapshot, calculateTrialEndDate, getDefaultCredits, getPlanDefinition } from '@/lib/plans';

export async function POST(req: Request) {
  const { userId, name, code } = await req.json();
  try {
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
    
    const trialPlanDefinition = getPlanDefinition('TRIAL');
    const planSnapshot = buildPlanSnapshot(trialPlanDefinition);
    const defaultCredits = getDefaultCredits(trialPlanDefinition);
    const trialEndsAt = calculateTrialEndDate(trialPlanDefinition);

    const team = await prisma.team.create({
      data: {
        name,
        code: hashedCode, // Código criptografado para verificação
        displayCode: code, // Código original para exibição
        adminId: userId,
        plan: planSnapshot,
        planKey: trialPlanDefinition.key,
        subscriptionStatus: 'TRIAL',
        trialEndsAt: trialEndsAt ?? undefined,
        credits: defaultCredits,
        members: {
          connect: { id: userId },
        },
      },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { teamId: team.id, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    });
    return NextResponse.json(team);
  } catch (error) {
    return NextResponse.json({ error: 'Team creation failed' }, { status: 500 });
  }
}

