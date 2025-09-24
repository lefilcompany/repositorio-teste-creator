import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed dos planos...')

  try {
    // Definir planos
    const plans = [
      {
        name: 'FREE',
        displayName: 'Plano Free',
        price: 0,
        trialDays: 7,
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
      },
      {
        name: 'ENTERPRISE',
        displayName: 'Plano Enterprise',
        price: 499.90,
        trialDays: 0,
        maxMembers: 999999,
        maxBrands: 999999,
        maxStrategicThemes: 999999,
        maxPersonas: 999999,
        quickContentCreations: 50,
        customContentSuggestions: 200,
        contentPlans: 100,
        contentReviews: 200,
        isActive: true
      }
    ]

    console.log('📝 Criando/verificando planos...')
    
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

    console.log('🎉 Seed concluído!')

  } catch (error) {
    console.error('💥 Erro durante o seed:', error)
    throw error
  }
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