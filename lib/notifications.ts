import { prisma } from '@/lib/prisma';

export interface CreateNotificationParams {
  userId: string;
  teamId: string;
  message: string;
  type: 'TEAM_JOIN_REQUEST' | 'TEAM_JOIN_APPROVED' | 'TEAM_JOIN_REJECTED' | 'SYSTEM' | 'INFO' | 'WARNING' | 'ERROR';
}

/**
 * Cria uma notificação para um usuário
 */
export async function createNotification({
  userId,
  teamId,
  message,
  type
}: CreateNotificationParams) {
  try {
    // Buscar informações da equipe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true }
    });

    // Criar no Prisma (banco principal)
    const notification = await prisma.notification.create({
      data: {
        userId,
        teamId,
        message,
        type,
        read: false
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Cria notificação para admin quando um usuário solicita entrada na equipe
 */
export async function notifyTeamJoinRequest(teamId: string, requestingUserId: string, requestingUserName: string) {
  try {
    // Buscar o admin da equipe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { adminId: true, name: true }
    });

    if (!team) return null;

    const message = `${requestingUserName} solicitou entrada na equipe ${team.name}`;
    
    return await createNotification({
      userId: team.adminId,
      teamId,
      message,
      type: 'TEAM_JOIN_REQUEST'
    });
  } catch (error) {
    console.error('Error notifying team join request:', error);
    return null;
  }
}

/**
 * Cria notificação para o usuário quando sua solicitação é aprovada
 */
export async function notifyTeamJoinApproved(userId: string, teamId: string, teamName: string) {
  try {
    const message = `Sua solicitação para entrar na equipe ${teamName} foi aprovada!`;
    
    return await createNotification({
      userId,
      teamId,
      message,
      type: 'TEAM_JOIN_APPROVED'
    });
  } catch (error) {
    console.error('Error notifying team join approved:', error);
    return null;
  }
}

/**
 * Cria notificação para o usuário quando sua solicitação é rejeitada
 */
export async function notifyTeamJoinRejected(userId: string, teamId: string, teamName: string) {
  try {
    const message = `Sua solicitação para entrar na equipe ${teamName} foi rejeitada.`;
    
    return await createNotification({
      userId,
      teamId,
      message,
      type: 'TEAM_JOIN_REJECTED'
    });
  } catch (error) {
    console.error('Error notifying team join rejected:', error);
    return null;
  }
}
