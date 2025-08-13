import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }
  
  try {
    const actions = await prisma.action.findMany({ 
      where: { teamId },
      include: {
        brand: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(actions);
  } catch (error) {
    console.error('Fetch actions error', error);
    return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { teamId, userId, brandId, type, details, result } = data;
    
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
    
    // Criar a ação
    const action = await prisma.action.create({ 
      data: {
        type,
        teamId,
        userId,
        brandId,
        details: details || null,
        result: result || null,
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
    console.error('Create action error', error);
    return NextResponse.json({ error: 'Failed to create action' }, { status: 500 });
  }
}
