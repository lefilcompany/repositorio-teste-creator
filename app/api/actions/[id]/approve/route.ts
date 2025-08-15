import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { approveGeneratedContent } from '@/lib/actionService';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const actionId = params.id;
    const data = await req.json();
    const { temporaryContentId, requesterUserId } = data;

    console.log('Aprovando conteúdo para ação:', actionId, { temporaryContentId, requesterUserId });

    return await prisma.$transaction(async (tx) => {
      const updated = await approveGeneratedContent(tx, {
        actionId,
        temporaryContentId,
        requesterUserId,
      });

      const full = await tx.action.findUnique({
        where: { id: updated.id },
        include: {
          brand: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      console.log('Conteúdo aprovado para ação:', updated.id);
      return NextResponse.json(full);
    });
  } catch (error) {
    console.error('Approve content error', error);
    return NextResponse.json({ error: 'Failed to approve content' }, { status: 500 });
  }
}
