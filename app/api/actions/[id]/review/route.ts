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
          userId: true,
          result: true 
        }
      });

      if (!action) {
        return NextResponse.json({ error: "Action não encontrada" }, { status: 404 });
      }

      // 2) Verificação de permissão
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

      // 3) Atualiza o resultado da Action com o novo conteúdo revisado
      const updatedAction = await tx.action.update({
        where: { id: actionId },
        data: {
          status: "Em revisão",
          revisions: { increment: 1 },
          result: {
            ...(action.result as any || {}),
            imageUrl: newImageUrl || (action.result as any)?.imageUrl || "",
            title: newTitle || (action.result as any)?.title || "",
            body: newBody || (action.result as any)?.body || "",
            hashtags: newHashtags || (action.result as any)?.hashtags || []
          },
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

      console.log('Revisão criada para ação:', updatedAction.id);
      return NextResponse.json({ 
        action: updatedAction
      });
    });
  } catch (error) {
    console.error('Review content error', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
