import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requestNewGeneration } from '@/lib/actionService';

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
      const { action, temporaryContent } = await requestNewGeneration(tx, {
        actionId,
        requesterUserId,
        newImageUrl,
        newTitle,
        newBody,
        newHashtags,
      });

      const fullAction = await tx.action.findUnique({
        where: { id: action.id },
        include: {
          brand: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      console.log('Revisão criada para ação:', action.id, 'TemporaryContent:', temporaryContent.id);
      return NextResponse.json({
        action: fullAction,
        temporaryContent,
      });
    });
  } catch (error) {
    console.error('Review content error', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
