import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const actionId = params.id;
    const data = await req.json();
    const { temporaryContentId, requesterUserId } = data;

    console.log('Aprovando conteúdo para ação:', actionId, { temporaryContentId, requesterUserId });

    return await prisma.$transaction(async (tx) => {
      // 1) Carrega a Action alvo
      const action = await tx.action.findUnique({
        where: { id: actionId },
        select: { 
          id: true, 
          teamId: true, 
          userId: true, 
          brandId: true, 
          approved: true, 
          status: true,
          type: true 
        }
      });

      if (!action) {
        return NextResponse.json({ error: "Action não encontrada" }, { status: 404 });
      }

      if (action.approved) {
        // Idempotência: já aprovado
        console.log('Action já estava aprovada:', actionId);
        return NextResponse.json(action);
      }

      // 2) (Opcional) Autorização: requester pertence ao mesmo team?
      if (requesterUserId && action.userId !== requesterUserId) {
        const requester = await tx.user.findFirst({
          where: { 
            id: requesterUserId, 
            teamId: action.teamId 
          }
        });
        if (!requester) {
          return NextResponse.json({ error: "Sem permissão para aprovar esta ação" }, { status: 403 });
        }
      }

      // 3) Carrega o TemporaryContent correto e *vinculado* à Action
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

      if (!temp) {
        return NextResponse.json({ error: "TemporaryContent não encontrado" }, { status: 404 });
      }

      if (temp.actionId !== actionId) {
        return NextResponse.json({ 
          error: "TemporaryContent não corresponde à Action informada" 
        }, { status: 400 });
      }

      // 4) Persiste resultado APENAS na Action alvo
      const updated = await tx.action.update({
        where: { id: actionId },
        data: {
          approved: true,
          status: "Aprovado",
          result: {
            imageUrl: temp.imageUrl,
            title: temp.title,
            body: temp.body,
            hashtags: temp.hashtags
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

      // 5) (Opcional) Marcar TemporaryContent como expirado
      await tx.temporaryContent.update({ 
        where: { id: temp.id }, 
        data: { expiresAt: new Date(Date.now() + 5 * 60 * 1000) } // expira em 5 minutos
      });

      console.log('Conteúdo aprovado para ação:', updated.id);
      return NextResponse.json(updated);
    });
  } catch (error) {
    console.error('Approve content error', error);
    return NextResponse.json({ error: 'Failed to approve content' }, { status: 500 });
  }
}
