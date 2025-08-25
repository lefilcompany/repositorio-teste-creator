import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const { userId, code } = await req.json();
  
  if (!userId || !code) {
    return NextResponse.json({ error: 'userId and code are required' }, { status: 400 });
  }

  try {
    // Buscar todas as equipes e verificar o código usando bcrypt
    const teams = await prisma.team.findMany();
    let targetTeam = null;
    
    for (const team of teams) {
      const isCodeMatch = await bcrypt.compare(code, team.code);
      if (isCodeMatch) {
        targetTeam = team;
        break;
      }
    }
    
    if (!targetTeam) {
      return NextResponse.json({ error: 'Código de equipe inválido' }, { status: 404 });
    }

    // Verificar se o usuário já é um membro ATIVO desta equipe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true, status: true }
    });

    if (user && user.teamId === targetTeam.id && user.status === UserStatus.ACTIVE) {
      return NextResponse.json({ error: 'Você já é membro desta equipe' }, { status: 400 });
    }

    // Check if user already has a pending request for this team
    const existingPendingRequest = await prisma.joinRequest.findFirst({
      where: { 
        teamId: targetTeam.id, 
        userId,
        status: 'PENDING'
      }
    });

    if (existingPendingRequest) {
      return NextResponse.json({ error: 'Você já tem uma solicitação pendente para esta equipe' }, { status: 400 });
    }

    // Create join request
    await prisma.joinRequest.create({ 
      data: { teamId: targetTeam.id, userId } 
    });

    // Update user to pending status and associate with team
    await prisma.user.update({
      where: { id: userId },
      data: { teamId: targetTeam.id, status: 'PENDING' },
    });

    return NextResponse.json({ 
      message: 'Solicitação de entrada enviada com sucesso',
      teamName: targetTeam.name 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao solicitar entrada na equipe' }, { status: 500 });
  }
}

