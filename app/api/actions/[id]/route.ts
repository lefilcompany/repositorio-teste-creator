import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const actionId = params.id;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID é obrigatório' }, { status: 400 });
    }

    if (!actionId) {
      return NextResponse.json({ error: 'Action ID é obrigatório' }, { status: 400 });
    }

    // Busca a ação específica incluindo as relações
    const action = await prisma.action.findFirst({
      where: {
        id: actionId,
        teamId: teamId,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!action) {
      return NextResponse.json({ error: 'Ação não encontrada' }, { status: 404 });
    }

    // Converte as datas para string para serialização
    const actionWithStringDates = {
      ...action,
      createdAt: action.createdAt.toISOString(),
      updatedAt: action.updatedAt ? action.updatedAt.toISOString() : null,
    };

    return NextResponse.json(actionWithStringDates);
  } catch (error) {
    console.error('Erro ao buscar ação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const actionId = params.id;
    const data = await req.json();
    const { result, status, approved, revisions } = data;
    
    console.log('Atualizando ação:', actionId, { result, status, approved, revisions });
    
    // Verificar se a ação existe
    const existingAction = await prisma.action.findUnique({
      where: { id: actionId }
    });
    
    if (!existingAction) {
      console.log('Ação não encontrada:', actionId);
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }
    
    console.log('Ação existente encontrada:', existingAction.id);
    
    // Atualizar a ação
    const updatedAction = await prisma.action.update({
      where: { id: actionId },
      data: {
        ...(result && { result }),
        ...(status && { status }),
        ...(approved !== undefined && { approved }),
        ...(revisions !== undefined && { revisions })
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
    
    console.log('Ação atualizada com sucesso:', updatedAction.id);
    return NextResponse.json(updatedAction);
  } catch (error) {
    console.error('Update action error', error);
    return NextResponse.json({ error: 'Failed to update action' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const actionId = params.id;
    
    // Verificar se a ação existe
    const existingAction = await prisma.action.findUnique({
      where: { id: actionId }
    });
    
    if (!existingAction) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }
    
    // Deletar a ação
    await prisma.action.delete({
      where: { id: actionId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete action error', error);
    return NextResponse.json({ error: 'Failed to delete action' }, { status: 500 });
  }
}
