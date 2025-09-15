import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  const limit = searchParams.get('limit');
  const approved = searchParams.get('approved');
  const type = searchParams.get('type');
  const summary = searchParams.get('summary') === 'true';
  
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }
  
  try {
    const whereClause: any = { teamId };
    
    if (userId) {
      whereClause.userId = userId;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    // Filtro específico para ações aprovadas (usado no histórico)
    if (approved === 'true') {
      whereClause.approved = true;
      whereClause.status = 'Aprovado';
    }
    
    // Definir limite padrão para evitar queries muito grandes
    const takeLimit = limit ? Math.min(parseInt(limit, 10), 100) : 20;
    
    let queryOptions: any;

    if (summary) {
      queryOptions = {
        where: whereClause,
        select: {
          id: true,
          type: true,
          createdAt: true,
          brand: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: takeLimit,
      };
    } else {
      queryOptions = {
        where: whereClause,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              segment: true,
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: takeLimit,
      };
    }
    
    const actions = await prisma.action.findMany(queryOptions);
    return NextResponse.json(actions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { id, status, approved, requesterUserId } = data;
    
    if (!id) {
      return NextResponse.json({ error: 'Action ID is required' }, { status: 400 });
    }
    
    // Busca a action para validar permissões
    const existingAction = await prisma.action.findUnique({
      where: { id },
      select: { 
        id: true, 
        teamId: true, 
        userId: true,
        status: true,
        approved: true,
        result: true
      }
    });
    
    if (!existingAction) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }
    
    // Verifica permissão do usuário
    if (requesterUserId && existingAction.userId !== requesterUserId) {
      const requester = await prisma.user.findFirst({
        where: { 
          id: requesterUserId, 
          teamId: existingAction.teamId 
        }
      });
      if (!requester) {
        return NextResponse.json({ error: 'Sem permissão para atualizar esta ação' }, { status: 403 });
      }
    }
    
    // Atualiza apenas os campos fornecidos
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (status !== undefined) {
      updateData.status = status;
      }
    if (approved !== undefined) {
      updateData.approved = approved;
      }
    
    const updatedAction = await prisma.action.update({
      where: { id },
      data: updateData,
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
    return NextResponse.json({ 
      error: 'Failed to update action', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { teamId, userId, brandId, type, details, result, status, approved, revisions } = data;
    
    // Validações básicas
    if (!teamId || !userId || !brandId || !type) {
      return NextResponse.json({ error: 'teamId, userId, brandId and type are required' }, { status: 400 });
    }
    
    // Verificar se o usuário pertence à equipe
    const user = await prisma.user.findFirst({
      where: { 
        id: userId, 
        teamId: teamId 
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found or not part of the team' }, { status: 403 });
    }
    
    // Verificar se a marca pertence à equipe
    const brand = await prisma.brand.findFirst({
      where: {
        id: brandId,
        teamId: teamId
      }
    });
    
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found or not part of the team' }, { status: 403 });
    }

    // Criar a ação - sempre com status "Em revisão" para CRIAR_CONTEUDO
    const action = await prisma.action.create({ 
      data: {
        type,
        teamId,
        userId,
        brandId,
        details: details || null,
        result: result || null,
        status: type === 'CRIAR_CONTEUDO' ? 'Em revisão' : (status || 'Em revisão'),
        approved: false, // Sempre false inicialmente
        revisions: revisions || 0,
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

    return NextResponse.json(action);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create action' }, { status: 500 });
  }
}

