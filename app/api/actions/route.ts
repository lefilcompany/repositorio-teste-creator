// /app/api/actions/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ActionType } from '@/types/action';

const DISPLAY_TO_ACTION_TYPE: { [key: string]: ActionType } = {
  'Criar conteúdo': 'CRIAR_CONTEUDO',
  'Revisar conteúdo': 'REVISAR_CONTEUDO',
  'Planejar conteúdo': 'PLANEJAR_CONTEUDO',
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  const approved = searchParams.get('approved');

  const brandName = searchParams.get('brandName');
  const typeDisplayName = searchParams.get('type');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const summary = searchParams.get('summary') === 'true';
  const getCount = searchParams.get('count') === 'true';

  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }

  try {
    const whereClause: any = { teamId };

    if (userId) whereClause.userId = userId;
    if (status) whereClause.status = status;

    if (approved === 'true') {
      whereClause.approved = true;
      whereClause.status = 'Aprovado';
    }

    if (brandName) {
      whereClause.brand = { name: brandName };
    }
    if (typeDisplayName && DISPLAY_TO_ACTION_TYPE[typeDisplayName]) {
      whereClause.type = DISPLAY_TO_ACTION_TYPE[typeDisplayName];
    }

    if (getCount) {
      const count = await prisma.action.count({ where: whereClause });
      return NextResponse.json({ count });
    }

    const skip = (page - 1) * limit;

    if (summary) {
      const [actions, total] = await prisma.$transaction([
        prisma.action.findMany({
          where: whereClause,
          select: {
            id: true,
            type: true,
            createdAt: true,
            brand: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: skip,
        }),
        prisma.action.count({ where: whereClause }),
      ]);

      return NextResponse.json({ data: actions, total });
    }

    // Busca completa padrão (com paginação)
    const [actions, total] = await prisma.$transaction([
      prisma.action.findMany({
        where: whereClause,
        include: {
          brand: { select: { id: true, name: true, segment: true } },
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      }),
      prisma.action.count({ where: whereClause }),
    ]);

    return NextResponse.json({ data: actions, total });

  } catch (error) {
    console.error("Erro ao buscar ações:", error);
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
        status: 'Em revisão', 
        approved: false, 
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