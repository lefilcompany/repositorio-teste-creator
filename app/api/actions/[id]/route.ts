// /app/api/actions/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const action = await prisma.action.findUnique({
      where: { id: params.id },
      include: {
        brand: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    if (!action) {
      return NextResponse.json({ error: 'Ação não encontrada' }, { status: 404 });
    }
    
    // OTIMIZAÇÃO: A serialização de datas é feita automaticamente pelo Next.js
    return NextResponse.json(action);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const { result, status, approved, revisions } = data;
    
    // OTIMIZAÇÃO: Atualize diretamente. O Prisma retornará um erro se não encontrar,
    // o que elimina a necessidade de uma busca prévia.
    const updatedAction = await prisma.action.update({
      where: { id: params.id },
      data: {
        ...(result && { result }),
        ...(status && { status }),
        ...(approved !== undefined && { approved }),
        ...(revisions !== undefined && { revisions }),
        updatedAt: new Date(),
      },
      include: {
        brand: true,
        user: { select: { id: true, name: true, email: true } }
      }
    });
    
    return NextResponse.json(updatedAction);
  } catch (error) {
    // Captura o erro caso a action não exista
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update action' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // OTIMIZAÇÃO: Delete diretamente sem verificar a existência antes.
    await prisma.action.delete({
      where: { id: params.id }
    });
    
    return new NextResponse(null, { status: 204 }); // Resposta padrão para sucesso sem conteúdo
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete action' }, { status: 500 });
  }
}