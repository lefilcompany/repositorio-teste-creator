import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserStatus, UserRole } from '@prisma/client';

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

    // Se o usuário é admin de uma equipe, verificar se há outros membros ativos
    if (user.adminTeams.length > 0) {
      // Verificar se há outros membros ativos na equipe além do admin atual
      const otherActiveMembers = await prisma.user.count({
        where: {
          teamId: user.adminTeams[0].id,
          status: 'ACTIVE',
          id: { not: userId }
        }
      });

      // Se há outros membros ativos, é obrigatório designar um novo admin
      if (otherActiveMembers > 0 && !newAdminId) {
        return NextResponse.json({ 
          error: 'New admin must be designated before deactivating admin account',
          isAdmin: true,
          teamId: user.adminTeams[0].id
        }, { status: 400 });
      }

      // Se um novo admin foi designado, verificar se é membro da equipe
      if (newAdminId) {
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
      } else if (otherActiveMembers === 0) {
        // Se não há outros membros ativos, apenas inativar sem transferir admin
        // A equipe permanece mas com admin inativo
        await prisma.user.update({
          where: { id: userId },
          data: {
            status: 'INACTIVE'
          }
        });
      }
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
