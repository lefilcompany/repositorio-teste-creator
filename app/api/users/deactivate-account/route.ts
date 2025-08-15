import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserStatus } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { userId, newAdminId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminTeams: true,
        team: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Se o usuário é admin de uma equipe, verificar se um novo admin foi designado
    if (user.adminTeams.length > 0) {
      if (!newAdminId) {
        return NextResponse.json({ 
          error: 'New admin must be designated before deactivating admin account',
          isAdmin: true,
          teamId: user.adminTeams[0].id
        }, { status: 400 });
      }

      // Verificar se o novo admin é membro da equipe
      const newAdmin = await prisma.user.findFirst({
        where: {
          id: newAdminId,
          teamId: user.adminTeams[0].id
        }
      });

      if (!newAdmin) {
        return NextResponse.json({ 
          error: 'New admin must be a member of the team' 
        }, { status: 400 });
      }

      // Usar transação para garantir atomicidade
      await prisma.$transaction(async (tx) => {
        // Atualizar o novo admin para ter role ADMIN
        await tx.user.update({
          where: { id: newAdminId },
          data: { role: 'ADMIN' }
        });

        // Transferir administração da equipe
        await tx.team.update({
          where: { id: user.adminTeams[0].id },
          data: { adminId: newAdminId }
        });

        // Inativar o usuário atual e mudar seu role para MEMBER
        await tx.user.update({
          where: { id: userId },
          data: {
            status: 'INACTIVE',
            role: 'MEMBER'
          }
        });
      });
    } else {
      // Se não é admin, apenas inativar
      await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'INACTIVE'
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate account error:', error);
    return NextResponse.json({ 
      error: 'Failed to deactivate account' 
    }, { status: 500 });
  }
}
