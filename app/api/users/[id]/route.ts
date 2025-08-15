import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    
    const user = await prisma.user.update({ 
      where: { id: params.id }, 
      data 
    });
    
    const { password, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Update user error', error);
    return NextResponse.json({ 
      error: 'Falha ao atualizar usuário' 
    }, { status: 500 });
  }
}
