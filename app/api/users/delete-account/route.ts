import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
          error: 'New admin must be designated before deleting admin account',
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
        }, {
          maxWait: 15000,
          timeout: 15000,
        });
      } else if (otherActiveMembers === 0) {
        // Se não há outros membros ativos, deletar a equipe e todas suas dependências
        const teamId = user.adminTeams[0].id;
        
        await prisma.$transaction(async (tx) => {
          // Deletar em ordem de dependências (foreign keys)
          
          // 1. Deletar personas primeiro (dependem de brands)
          await tx.persona.deleteMany({
            where: { teamId }
          });
          
          // 2. Deletar themes (dependem de brands)
          await tx.strategicTheme.deleteMany({
            where: { teamId }
          });
          
          // 3. Deletar actions (dependem de brands)
          await tx.action.deleteMany({
            where: { 
              teamId: teamId
            }
          });
          
          // 4. Agora deletar brands (sem dependências)
          await tx.brand.deleteMany({
            where: { teamId }
          });
          
          // 5. Deletar notificações
          await tx.notification.deleteMany({
            where: { 
              teamId: teamId
            }
          });
          
          // 6. Deletar requests de entrada na equipe
          await tx.joinRequest.deleteMany({
            where: { teamId }
          });
          
          // 7. Deletar subscriptions da equipe
          await tx.subscription.deleteMany({
            where: { teamId }
          });
          
          // 8. Por último, deletar o team
          await tx.team.delete({
            where: { id: teamId }
          });
        }, {
          maxWait: 30000, // 30 segundos - operação complexa
          timeout: 30000,
        });
      } else {
        // Se há outros membros ativos mas não designou novo admin, só deletar dados do usuário
        await prisma.$transaction(async (tx) => {
          // Deletar em ordem de dependências
          
          // 1. Deletar actions do usuário
          await tx.action.deleteMany({
            where: { userId }
          });
          
          // 2. Deletar personas do usuário (dependem de brands)
          await tx.persona.deleteMany({
            where: { userId }
          });
          
          // 3. Deletar themes do usuário (dependem de brands)
          await tx.strategicTheme.deleteMany({
            where: { userId }
          });
          
          // 4. Deletar brands do usuário
          await tx.brand.deleteMany({
            where: { userId }
          });
          
          // 5. Deletar notificações do usuário
          await tx.notification.deleteMany({
            where: { userId }
          });

          // 6. Deletar requests de entrada na equipe
          await tx.joinRequest.deleteMany({
            where: { userId }
          });
        }, {
          maxWait: 20000, // 20 segundos
          timeout: 20000,
        });
      }
    } else {
      // Usuário não é admin, deletar apenas seus dados
      await prisma.$transaction(async (tx) => {
        // Deletar em ordem de dependências
        
        // 1. Deletar actions do usuário
        await tx.action.deleteMany({
          where: { userId }
        });
        
        // 2. Deletar personas do usuário (dependem de brands)
        await tx.persona.deleteMany({
          where: { userId }
        });
        
        // 3. Deletar themes do usuário (dependem de brands)
        await tx.strategicTheme.deleteMany({
          where: { userId }
        });
        
        // 4. Deletar brands do usuário
        await tx.brand.deleteMany({
          where: { userId }
        });
        
        // 5. Deletar notificações do usuário
        await tx.notification.deleteMany({
          where: { userId }
        });

        // 6. Deletar requests de entrada na equipe
        await tx.joinRequest.deleteMany({
          where: { userId }
        });
      }, {
        maxWait: 20000, // 20 segundos
        timeout: 20000,
      });
      
      // Deletar todas as notificações do usuário
      await prisma.notification.deleteMany({
        where: { userId }
      });

      // Deletar requests de entrada na equipe
      await prisma.joinRequest.deleteMany({
        where: { userId }
      });
    }

    // Finalmente, deletar o usuário
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to delete account' 
    }, { status: 500 });
  }
}
