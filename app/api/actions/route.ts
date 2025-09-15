// /app/api/actions/route.ts

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
  
  // Parâmetros de otimização
  const summary = searchParams.get('summary') === 'true';
  const getCount = searchParams.get('count') === 'true';

  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }

  try {
    const whereClause: any = { teamId };
    
    if (userId) whereClause.userId = userId;
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    if (approved === 'true') {
      whereClause.approved = true;
      whereClause.status = 'Aprovado';
    }

    // OTIMIZAÇÃO: Se for apenas para contagem, use `count()` que é muito mais rápido
    if (getCount) {
      const count = await prisma.action.count({ where: whereClause });
      return NextResponse.json({ count });
    }
    
    // OTIMIZAÇÃO: Se for um resumo, selecione apenas os campos essenciais
    if (summary) {
      const actions = await prisma.action.findMany({
        where: whereClause,
        select: {
          id: true,
          type: true,
          createdAt: true,
          brand: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit ? parseInt(limit, 10) : 3, // Limite menor para resumos
      });
      return NextResponse.json(actions);
    }

    // Busca completa padrão
    const takeLimit = limit ? Math.min(parseInt(limit, 10), 100) : 20;
    const actions = await prisma.action.findMany({
      where: whereClause,
      include: {
        brand: { select: { id: true, name: true, segment: true } },
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: takeLimit,
    });
    
    return NextResponse.json(actions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { teamId, userId, brandId, type, details, result } = data;

    if (!teamId || !userId || !brandId || !type) {
      return NextResponse.json({ error: 'teamId, userId, brandId and type are required' }, { status: 400 });
    }

    // OTIMIZAÇÃO: Valide permissões em paralelo
    const [user, brand] = await Promise.all([
      prisma.user.findFirst({ where: { id: userId, teamId: teamId } }),
      prisma.brand.findFirst({ where: { id: brandId, teamId: teamId } })
    ]);
    
    if (!user) return NextResponse.json({ error: 'User not found or not part of the team' }, { status: 403 });
    if (!brand) return NextResponse.json({ error: 'Brand not found or not part of the team' }, { status: 403 });

    const action = await prisma.action.create({
      data: {
        type,
        teamId,
        userId,
        brandId,
        details: details || null,
        result: result || null,
        status: 'Em revisão', // Status inicial padrão
        approved: false, // Sempre `false` ao criar
        revisions: 0,
      },
      include: {
        brand: true,
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json(action);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create action' }, { status: 500 });
  }
}