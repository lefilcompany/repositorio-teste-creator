import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed dos planos...')

  // Criar planos se não existirem
  const plans = [
    {
      name: 'FREE',
      displayName: 'Plano Free',
      price: 0,
      trialDays: 14,
      maxMembers: 5,
      maxBrands: 1,
      maxStrategicThemes: 3,
      maxPersonas: 3,
      quickContentCreations: 5,
      customContentSuggestions: 15,
      contentPlans: 5,
      contentReviews: 10,
      isActive: true
    },
    {
      name: 'BASIC',
      displayName: 'Plano Básico',
      price: 59.90,
      trialDays: 0,
      maxMembers: 10,
      maxBrands: 5,
      maxStrategicThemes: 15,
      maxPersonas: 15,
      quickContentCreations: 7,
      customContentSuggestions: 20,
      contentPlans: 7,
      contentReviews: 15,
      isActive: true
    },
    {
      name: 'PRO',
      displayName: 'Plano Pro',
      price: 99.90,
      trialDays: 0,
      maxMembers: 20,
      maxBrands: 10,
      maxStrategicThemes: 30,
      maxPersonas: 30,
      quickContentCreations: 10,
      customContentSuggestions: 30,
      contentPlans: 10,
      contentReviews: 25,
      isActive: true
    }
  ]

  for (const planData of plans) {
    const existingPlan = await prisma.plan.findUnique({
      where: { name: planData.name }
    })

    if (!existingPlan) {
      const plan = await prisma.plan.create({
        data: planData
      })
      console.log(`✅ Plano criado: ${plan.displayName}`)
    } else {
      console.log(`⚠️  Plano já existe: ${existingPlan.displayName}`)
    }
  }

  // Migrar times existentes para o plano FREE com trial
  console.log('🔄 Migrando times existentes para o plano FREE...')
  
  const freePlan = await prisma.plan.findUnique({
    where: { name: 'FREE' }
  })

  if (freePlan) {
    const teamsWithoutSubscription = await prisma.team.findMany({
      where: {
        subscriptions: {
          none: {}
        }
      }
    })

    for (const team of teamsWithoutSubscription) {
      // Calcular data de fim do trial
      const trialEndDate = new Date(team.createdAt)
      trialEndDate.setDate(trialEndDate.getDate() + 14)

      // Verificar se ainda está no período de trial
      const isTrialActive = new Date() <= trialEndDate

      await prisma.subscription.create({
        data: {
          teamId: team.id,
          planId: freePlan.id,
          status: isTrialActive ? 'TRIAL' : 'EXPIRED',
          trialEndDate: trialEndDate,
          isActive: isTrialActive
        }
      })

      // Atualizar campos do time
      await prisma.team.update({
        where: { id: team.id },
        data: {
          trialEndsAt: trialEndDate,
          isTrialActive: isTrialActive
        }
      })

      console.log(`✅ Time migrado: ${team.name} (Trial ${isTrialActive ? 'ativo' : 'expirado'})`)
    }
  }

  console.log('🎉 Seed concluído!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })