import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    
    // Verificar se a persona existe
    const existingPersona = await prisma.persona.findUnique({
      where: { id: params.id }
    });

    if (!existingPersona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    // Preparar dados para atualização, mantendo valores padrão para campos vazios
    const updateData = {
      ...data,
      professionalContext: data.professionalContext || '',
      beliefsAndInterests: data.beliefsAndInterests || '',
      contentConsumptionRoutine: data.contentConsumptionRoutine || '',
      preferredToneOfVoice: data.preferredToneOfVoice || '',
      purchaseJourneyStage: data.purchaseJourneyStage || '',
      interestTriggers: data.interestTriggers || '',
    };

    const persona = await prisma.persona.update({ 
      where: { id: params.id }, 
      data: updateData 
    });
    
    return NextResponse.json(persona);
  } catch (error) {
    console.error('Error updating persona:', error);
    return NextResponse.json({ error: 'Failed to update persona' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar se a persona existe
    const existingPersona = await prisma.persona.findUnique({
      where: { id: params.id }
    });

    if (!existingPersona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    await prisma.persona.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, message: 'Persona deleted successfully' });
  } catch (error) {
    console.error('Error deleting persona:', error);
    return NextResponse.json({ error: 'Failed to delete persona' }, { status: 500 });
  }
}
