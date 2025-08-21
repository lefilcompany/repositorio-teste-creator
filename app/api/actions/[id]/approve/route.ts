import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const actionId = params.id;
    const data = await req.json();
    const { requesterUserId } = data;

    console.log('Aprovando conteúdo para ação:', actionId, { requesterUserId });

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
          type: true,
          result: true 
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

      // 2) Autorização: requester pertence ao mesmo team?
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

      // 3) Aprova a Action - o resultado já está salvo na própria Action
      const updated = await tx.action.update({
        where: { id: actionId },
        data: {
          approved: true,
          status: "Aprovado",
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

      console.log('Conteúdo aprovado para ação:', updated.id);
      return NextResponse.json(updated);
    }, {
      maxWait: 15000, // 15 segundos para aguardar conexão
      timeout: 15000, // 15 segundos para executar a transação
    });
  } catch (error) {
    console.error('Approve content error', error);
    return NextResponse.json({ error: 'Failed to approve content' }, { status: 500 });
  }
}
