import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
  }
  
  try {
    const brands = await prisma.brand.findMany({ 
      where: { teamId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Fetch brands error', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { teamId, userId, ...brandData } = data;
    
    // Validações básicas
    if (!teamId || !userId) {
      return NextResponse.json({ error: 'teamId and userId are required' }, { status: 400 });
    }
    
    if (!brandData.name || !brandData.responsible) {
      return NextResponse.json({ error: 'name and responsible are required' }, { status: 400 });
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
    
    // Criar a marca
    const brand = await prisma.brand.create({ 
      data: {
        ...brandData,
        teamId,
        userId,
        // Garantir que os campos obrigatórios do schema estão preenchidos
        segment: brandData.segment || '',
        values: brandData.values || '',
        keywords: brandData.keywords || '',
        goals: brandData.goals || '',
        inspirations: brandData.inspirations || '',
        successMetrics: brandData.successMetrics || '',
        references: brandData.references || '',
        specialDates: brandData.specialDates || '',
        sectorRestrictions: brandData.sectorRestrictions || '',
        promise: brandData.promise || '',
        crisisInfo: brandData.crisisInfo || '',
        milestones: brandData.milestones || '',
        collaborations: brandData.collaborations || '',
        restrictions: brandData.restrictions || '',
      }
    });
    
    return NextResponse.json(brand);
  } catch (error) {
    console.error('Create brand error', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
