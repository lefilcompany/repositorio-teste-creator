import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const { teamId, userId, ...brandData } = data;
    
    // Validações básicas
    if (!teamId || !userId) {
      return NextResponse.json({ error: 'teamId and userId are required' }, { status: 400 });
    }
    
    // Validações de campos obrigatórios
    const requiredFields = [
      { field: 'name', label: 'Nome da marca' },
      { field: 'responsible', label: 'Responsável da marca' },
      { field: 'segment', label: 'Segmento' },
      { field: 'values', label: 'Valores' },
      { field: 'goals', label: 'Metas de negócio' },
      { field: 'successMetrics', label: 'Indicadores de sucesso' },
      { field: 'references', label: 'Conteúdos de referência' },
      { field: 'promise', label: 'Promessa única' },
      { field: 'restrictions', label: 'Restrições' },
      { field: 'moodboard', label: 'Moodboard' },
      { field: 'logo', label: 'Logo da marca' }
    ];

    const missingFields = requiredFields.filter(({ field }) => {
      if (field === 'moodboard') {
        return !brandData.moodboard;
      }
      if (field === 'logo') {
        return !brandData.logo;
      }
      return !brandData[field] || brandData[field].toString().trim() === '';
    });

    if (missingFields.length > 0) {
      const fieldsList = missingFields.map(({ label }) => label).join(', ');
      return NextResponse.json({ 
        error: `Os seguintes campos são obrigatórios: ${fieldsList}` 
      }, { status: 400 });
    }
    
    // Verificar se a marca existe e pertence à equipe
    const existingBrand = await prisma.brand.findFirst({
      where: { 
        id: params.id, 
        teamId: teamId 
      }
    });
    
    if (!existingBrand) {
      return NextResponse.json({ error: 'Brand not found or access denied' }, { status: 404 });
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
    
    // Atualizar a marca
    const brand = await prisma.brand.update({ 
      where: { id: params.id }, 
      data: {
        ...brandData,
        // Garantir que os campos obrigatórios do schema estão preenchidos
        segment: brandData.segment,
        values: brandData.values,
        keywords: brandData.keywords || '',
        goals: brandData.goals,
        inspirations: brandData.inspirations || '',
        successMetrics: brandData.successMetrics,
        references: brandData.references,
        specialDates: brandData.specialDates || '',
        promise: brandData.promise,
        crisisInfo: brandData.crisisInfo || '',
        milestones: brandData.milestones || '',
        collaborations: brandData.collaborations || '',
        restrictions: brandData.restrictions,
        moodboard: brandData.moodboard || null,
        logo: brandData.logo || null,
        referenceImage: brandData.referenceImage || null,
        colorPalette: brandData.colorPalette || null, // Adicionado campo de paleta de cores
      }
    });
    
    return NextResponse.json(brand);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    const userId = searchParams.get('userId');
    
    // Validações básicas
    if (!teamId || !userId) {
      return NextResponse.json({ error: 'teamId and userId are required' }, { status: 400 });
    }
    
    // Verificar se a marca existe e pertence à equipe
    const existingBrand = await prisma.brand.findFirst({
      where: { 
        id: params.id, 
        teamId: teamId 
      }
    });
    
    if (!existingBrand) {
      return NextResponse.json({ error: 'Brand not found or access denied' }, { status: 404 });
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
    
    // Deletar a marca
    await prisma.brand.delete({ where: { id: params.id } });
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}
