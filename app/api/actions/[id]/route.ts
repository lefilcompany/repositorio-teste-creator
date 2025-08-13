import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const actionId = params.id;
    const data = await req.json();
    const { result, status, approved, revisions } = data;
    
    // Verificar se a ação existe
    const existingAction = await prisma.action.findUnique({
      where: { id: actionId }
    });
    
    if (!existingAction) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }
    
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
