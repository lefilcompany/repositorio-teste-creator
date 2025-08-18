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

    // Se o usuário é admin de uma equipe, verificar se um novo admin foi designado
    if (user.adminTeams.length > 0) {
      if (!newAdminId) {
        return NextResponse.json({ 
          error: 'New admin must be designated before deleting admin account',
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
      });
    }

    // Deletar todas as ações do usuário
    await prisma.action.deleteMany({
      where: { userId }
    });
    
    // Deletar todas as marcas do usuário
    await prisma.brand.deleteMany({
      where: { userId }
    });

    // Deletar todos os temas do usuário
    await prisma.strategicTheme.deleteMany({
      where: { userId }
    });

    // Deletar todas as personas do usuário
    await prisma.persona.deleteMany({
      where: { userId }
    });

    // Deletar todas as notificações do usuário
    await prisma.notification.deleteMany({
      where: { userId }
    });

    // Deletar requests de entrada na equipe
    await prisma.joinRequest.deleteMany({
      where: { userId }
    });

    // Finalmente, deletar o usuário
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete account' 
    }, { status: 500 });
  }
}