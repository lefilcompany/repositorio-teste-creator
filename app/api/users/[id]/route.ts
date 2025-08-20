import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const targetUserId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        state: true,
        city: true,
        status: true,
        role: true,
        teamId: true,
        team: {
          select: {
            id: true,
            name: true,
            displayCode: true,
            adminId: true,
            plan: true,
            members: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    // Obter dados do usuário dos headers (adicionados pelo middleware)
    const requestUserId = req.headers.get('x-user-id');
    const targetUserId = params.id;

    if (!requestUserId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Usuário só pode atualizar seus próprios dados
    if (requestUserId !== targetUserId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const data = await req.json();
    
    // Se há uma senha para atualizar, criptografá-la
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    // Remover campos que não devem ser atualizados diretamente por segurança
    const { teamId, status, role, ...allowedUpdates } = data;
    
    const user = await prisma.user.update({ 
      where: { id: params.id }, 
      data: allowedUpdates 
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
