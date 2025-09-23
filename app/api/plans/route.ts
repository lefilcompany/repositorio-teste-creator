// app/api/plans/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPlanSchema, PlanValidations } from '@/lib/plan-validations';

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    return NextResponse.json(plans);

  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validação com Zod
    const validationResult = createPlanSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return NextResponse.json(
        { error: 'Dados inválidos', details: errors }, 
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Validações de negócio
    const businessErrors = PlanValidations.validatePlanLogic(validatedData);
    if (businessErrors.length > 0) {
      return NextResponse.json(
        { error: 'Erro de validação de negócio', details: businessErrors },
        { status: 400 }
      );
    }

    // Validação se o nome do plano já existe
    const existingPlan = await prisma.plan.findUnique({
      where: { name: validatedData.name }
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: 'Já existe um plano com este nome' },
        { status: 409 }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        name: validatedData.name,
        displayName: validatedData.displayName,
        price: validatedData.price,
        trialDays: validatedData.trialDays,
        maxMembers: validatedData.maxMembers,
        maxBrands: validatedData.maxBrands,
        maxStrategicThemes: validatedData.maxStrategicThemes,
        maxPersonas: validatedData.maxPersonas,
        quickContentCreations: validatedData.quickContentCreations,
        customContentSuggestions: validatedData.customContentSuggestions,
        contentPlans: validatedData.contentPlans,
        contentReviews: validatedData.contentReviews,
        isActive: validatedData.isActive,
        stripePriceId: validatedData.stripePriceId ?? null
      }
    });

    return NextResponse.json(plan, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar plano:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}