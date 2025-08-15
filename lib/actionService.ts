import { Prisma } from '@prisma/client';

export type ApproveInput = {
  actionId: string;
  temporaryContentId: string;
  requesterUserId?: string;
};

export async function approveGeneratedContent(
  tx: Prisma.TransactionClient,
  { actionId, temporaryContentId, requesterUserId }: ApproveInput
) {
  // 1) Load target Action
  const action = await tx.action.findUnique({
    where: { id: actionId },
    select: {
      id: true,
      teamId: true,
      userId: true,
      brandId: true,
      approved: true,
      status: true
    }
  });
  if (!action) throw new Error('Action não encontrada');
  if (action.approved) return action; // idempotence

  // 2) Optional authorization
  if (requesterUserId && action.userId !== requesterUserId) {
    const requester = await tx.user.findFirst({
      where: { id: requesterUserId, teamId: action.teamId }
    });
    if (!requester) throw new Error('Sem permissão para aprovar esta ação');
  }

  // 3) Load TemporaryContent linked to Action
  const temp = await tx.temporaryContent.findUnique({
    where: { id: temporaryContentId },
    select: {
      id: true,
      actionId: true,
      imageUrl: true,
      title: true,
      body: true,
      hashtags: true
    }
  });
  if (!temp) throw new Error('TemporaryContent não encontrado');
  if (temp.actionId !== actionId) throw new Error('TemporaryContent não corresponde à Action informada');

  // 4) Persist result only on target Action
  const updated = await tx.action.update({
    where: { id: actionId },
    data: {
      approved: true,
      status: 'Aprovado',
      result: {
        imageUrl: temp.imageUrl,
        title: temp.title,
        body: temp.body,
        hashtags: temp.hashtags
      },
      updatedAt: new Date()
    }
  });

  // 5) Optionally expire TemporaryContent
  await tx.temporaryContent.update({
    where: { id: temp.id },
    data: { expiresAt: new Date(Date.now() + 5 * 60 * 1000) }
  });

  return updated;
}

export type ReviewInput = {
  actionId: string;
  requesterUserId?: string;
  newImageUrl?: string;
  newTitle?: string;
  newBody?: string;
  newHashtags?: string[];
};

export async function requestNewGeneration(
  tx: Prisma.TransactionClient,
  { actionId, requesterUserId, newImageUrl, newTitle, newBody, newHashtags }: ReviewInput
) {
  const action = await tx.action.findUnique({
    where: { id: actionId },
    select: {
      id: true,
      approved: true,
      revisions: true,
      status: true,
      teamId: true,
      userId: true
    }
  });
  if (!action) throw new Error('Action não encontrada');

  if (requesterUserId && action.userId !== requesterUserId) {
    const requester = await tx.user.findFirst({
      where: { id: requesterUserId, teamId: action.teamId }
    });
    if (!requester) throw new Error('Sem permissão para revisar esta ação');
  }

  // Remove previous TemporaryContent linked to this Action
  await tx.temporaryContent.deleteMany({ where: { actionId } });

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const temp = await tx.temporaryContent.create({
    data: {
      actionId,
      userId: requesterUserId || action.userId,
      teamId: action.teamId,
      imageUrl: newImageUrl || '',
      title: newTitle || '',
      body: newBody || '',
      hashtags: (newHashtags ?? []) as unknown as any,
      originalId: null,
      expiresAt
    }
  });

  const updatedAction = await tx.action.update({
    where: { id: actionId },
    data: {
      status: 'Em revisão',
      revisions: { increment: 1 },
      updatedAt: new Date()
    }
  });

  return { action: updatedAction, temporaryContent: temp };
}
