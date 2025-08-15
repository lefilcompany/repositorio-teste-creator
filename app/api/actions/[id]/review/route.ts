import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const actionId = params.id;
    const data = await req.json();
    const { 
      requesterUserId, 
      newImageUrl, 
      newTitle, 
      newBody, 
      newHashtags 
    } = data;

    console.log('Solicitando revisão para ação:', actionId, { requesterUserId });

    return await prisma.$transaction(async (tx) => {
      // 1) Carrega a Action alvo
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

      if (!action) {
        return NextResponse.json({ error: "Action não encontrada" }, { status: 404 });
      }

      // 2) (Opcional) Verificação de permissão
      if (requesterUserId && action.userId !== requesterUserId) {
        const requester = await tx.user.findFirst({
          where: { 
            id: requesterUserId, 
            teamId: action.teamId 
          }
        });
        if (!requester) {
          return NextResponse.json({ error: "Sem permissão para revisar esta ação" }, { status: 403 });
        }
      }

      // 3) Remove TemporaryContent anterior vinculado a esta Action (se existir)
      await tx.temporaryContent.deleteMany({
        where: {
          actionId: actionId
        }
      });

      // 4) Cria novo TemporaryContent vinculado à Action
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const temp = await tx.temporaryContent.create({
        data: {
          actionId,
          userId: requesterUserId || action.userId,
          teamId: action.teamId,
          imageUrl: newImageUrl || "",
          title: newTitle || "",
          body: newBody || "",
          hashtags: (newHashtags ?? []) as unknown as any, // Json
          originalId: null,
          expiresAt
        }
      });

      // 5) Atualiza a Action: sinaliza "Em revisão" + incrementa contador
      const updatedAction = await tx.action.update({
        where: { id: actionId },
        data: {
          status: "Em revisão",
          revisions: { increment: 1 },
          updatedAt: new Date()
        },
        include: {
          brand: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      console.log('Revisão criada para ação:', updatedAction.id, 'TemporaryContent:', temp.id);
      return NextResponse.json({ 
        action: updatedAction, 
        temporaryContent: temp 
      });
    });
  } catch (error) {
    console.error('Review content error', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
