// app/api/plans/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updatePlanSchema, PlanValidations } from '@/lib/plan-validations';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: params.id },
      include: {
        teamsUsingPlan: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            subscriptions: true
          }
        }
      }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);

  } catch (error) {
    console.error('Erro ao buscar plano:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validação com Zod
    const validationResult = updatePlanSchema.safeParse(body);
    
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

    // Verificar se o plano existe
    const existingPlan = await prisma.plan.findUnique({
      where: { id: params.id }
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    // Criar dados mesclados para validação de negócio
    const mergedData = { ...existingPlan, ...validatedData };
    
    // Validações de negócio
    const businessErrors = PlanValidations.validatePlanLogic(mergedData);
    if (businessErrors.length > 0) {
      return NextResponse.json(
        { error: 'Erro de validação de negócio', details: businessErrors },
        { status: 400 }
      );
    }

    // Validar se o nome não está sendo usado por outro plano
    if (validatedData.name && validatedData.name !== existingPlan.name) {
      const planWithSameName = await prisma.plan.findUnique({
        where: { name: validatedData.name }
      });

      if (planWithSameName) {
        return NextResponse.json(
          { error: 'Já existe um plano com este nome' },
          { status: 409 }
        );
      }
    }

    // Preparar dados para atualização (remover campos undefined)
    const updateData: any = {};
    Object.keys(validatedData).forEach(key => {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        updateData[key] = validatedData[key as keyof typeof validatedData];
      }
    });

    const plan = await prisma.plan.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json(plan);

  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se o plano existe
    const existingPlan = await prisma.plan.findUnique({
      where: { id: params.id },
      include: {
        teamsUsingPlan: true,
        subscriptions: {
          where: {
            isActive: true
          }
        }
      }
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    // Preparar dados de uso para validação
    const usageData = {
      teamsCount: existingPlan.teamsUsingPlan.length,
      activeSubscriptions: existingPlan.subscriptions.length
    };

    // Validações de negócio para exclusão
    const deletionErrors = PlanValidations.validatePlanDeletion(existingPlan, usageData);
    if (deletionErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível excluir este plano',
          details: deletionErrors,
          usage: usageData
        },
        { status: 409 }
      );
    }

    // Fazer soft delete marcando como inativo ao invés de excluir
    const plan = await prisma.plan.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({ 
      message: 'Plano desativado com sucesso',
      plan 
    });

  } catch (error) {
    console.error('Erro ao excluir plano:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}