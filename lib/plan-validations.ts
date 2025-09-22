// lib/plan-validations.ts
import { z } from 'zod';

// Schema de validação para criação de plano
export const createPlanSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .regex(/^[A-Z_]+$/, 'Nome deve conter apenas letras maiúsculas e underscores'),
  
  displayName: z.string()
    .min(1, 'Nome de exibição é obrigatório')
    .max(100, 'Nome de exibição deve ter no máximo 100 caracteres'),
  
  price: z.number()
    .min(0, 'Preço deve ser maior ou igual a zero')
    .max(9999.99, 'Preço deve ser menor que R$ 10.000'),
  
  trialDays: z.number()
    .int('Dias de trial deve ser um número inteiro')
    .min(0, 'Dias de trial deve ser maior ou igual a zero')
    .max(365, 'Dias de trial não pode exceder 365 dias')
    .default(0),
  
  maxMembers: z.number()
    .int('Número máximo de membros deve ser um número inteiro')
    .min(1, 'Deve permitir pelo menos 1 membro')
    .max(1000, 'Número máximo de membros não pode exceder 1000'),
  
  maxBrands: z.number()
    .int('Número máximo de marcas deve ser um número inteiro')
    .min(1, 'Deve permitir pelo menos 1 marca')
    .max(100, 'Número máximo de marcas não pode exceder 100'),
  
  maxStrategicThemes: z.number()
    .int('Número máximo de temas estratégicos deve ser um número inteiro')
    .min(1, 'Deve permitir pelo menos 1 tema estratégico')
    .max(500, 'Número máximo de temas estratégicos não pode exceder 500'),
  
  maxPersonas: z.number()
    .int('Número máximo de personas deve ser um número inteiro')
    .min(1, 'Deve permitir pelo menos 1 persona')
    .max(500, 'Número máximo de personas não pode exceder 500'),
  
  quickContentCreations: z.number()
    .int('Número de criações rápidas deve ser um número inteiro')
    .min(0, 'Criações rápidas deve ser maior ou igual a zero')
    .max(1000, 'Criações rápidas não pode exceder 1000'),
  
  customContentSuggestions: z.number()
    .int('Número de sugestões personalizadas deve ser um número inteiro')
    .min(0, 'Sugestões personalizadas deve ser maior ou igual a zero')
    .max(1000, 'Sugestões personalizadas não pode exceder 1000'),
  
  contentPlans: z.number()
    .int('Número de planejamentos deve ser um número inteiro')
    .min(0, 'Planejamentos deve ser maior ou igual a zero')
    .max(500, 'Planejamentos não pode exceder 500'),
  
  contentReviews: z.number()
    .int('Número de revisões deve ser um número inteiro')
    .min(0, 'Revisões deve ser maior ou igual a zero')
    .max(1000, 'Revisões não pode exceder 1000'),
  
  isActive: z.boolean().default(true)
});

// Schema para atualização de plano (todos os campos opcionais)
export const updatePlanSchema = createPlanSchema.partial();

// Validações de negócio específicas
export class PlanValidations {
  /**
   * Valida se o plano tem configurações lógicas
   */
  static validatePlanLogic(planData: any): string[] {
    const errors: string[] = [];
    
    // Planos gratuitos não devem ter preço
    if (planData.name === 'FREE' && planData.price > 0) {
      errors.push('Plano gratuito não pode ter preço maior que zero');
    }
    
    // Planos pagos devem ter preço
    if (planData.name !== 'FREE' && planData.price <= 0) {
      errors.push('Planos pagos devem ter preço maior que zero');
    }
    
    // Trial só faz sentido para planos gratuitos
    if (planData.name !== 'FREE' && planData.trialDays > 0) {
      errors.push('Apenas planos gratuitos podem ter período de trial');
    }
    
    // Validar hierarquia de planos (Básico < Pro)
    if (planData.name === 'BASIC') {
      // Validações específicas para plano básico
      if (planData.maxMembers > 15) {
        errors.push('Plano básico não deve ter mais que 15 membros');
      }
      if (planData.price > 80) {
        errors.push('Plano básico não deve custar mais que R$ 80');
      }
    }
    
    if (planData.name === 'PRO') {
      // Validações específicas para plano pro
      if (planData.maxMembers <= 10) {
        errors.push('Plano Pro deve ter mais membros que o plano básico');
      }
      if (planData.price <= 60) {
        errors.push('Plano Pro deve custar mais que o plano básico');
      }
    }
    
    // Validar consistência interna
    if (planData.quickContentCreations > planData.customContentSuggestions) {
      errors.push('Criações rápidas não devem exceder sugestões personalizadas');
    }
    
    if (planData.contentPlans > planData.contentReviews) {
      errors.push('Planejamentos não devem exceder revisões');
    }
    
    return errors;
  }
  
  /**
   * Valida se um plano pode ser deletado
   */
  static validatePlanDeletion(plan: any, usage: any): string[] {
    const errors: string[] = [];
    
    // Não permitir deletar planos padrão do sistema
    const systemPlans = ['FREE', 'BASIC', 'PRO'];
    if (systemPlans.includes(plan.name)) {
      errors.push('Não é possível deletar planos padrão do sistema');
    }
    
    // Verificar se há times usando o plano
    if (usage.teamsCount > 0) {
      errors.push(`Não é possível deletar plano com ${usage.teamsCount} time(s) ativo(s)`);
    }
    
    // Verificar se há assinaturas ativas
    if (usage.activeSubscriptions > 0) {
      errors.push(`Não é possível deletar plano com ${usage.activeSubscriptions} assinatura(s) ativa(s)`);
    }
    
    return errors;
  }
  
  /**
   * Valida limites de uso do plano
   */
  static validatePlanUsage(teamData: any, planLimits: any): { 
    isValid: boolean; 
    errors: string[]; 
    warnings: string[] 
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Verificar limites rígidos
    if (teamData.memberCount > planLimits.maxMembers) {
      errors.push(`Time excede limite de membros (${teamData.memberCount}/${planLimits.maxMembers})`);
    }
    
    if (teamData.brandCount > planLimits.maxBrands) {
      errors.push(`Time excede limite de marcas (${teamData.brandCount}/${planLimits.maxBrands})`);
    }
    
    if (teamData.themeCount > planLimits.maxStrategicThemes) {
      errors.push(`Time excede limite de temas (${teamData.themeCount}/${planLimits.maxStrategicThemes})`);
    }
    
    if (teamData.personaCount > planLimits.maxPersonas) {
      errors.push(`Time excede limite de personas (${teamData.personaCount}/${planLimits.maxPersonas})`);
    }
    
    // Verificar limites de uso mensal (warnings)
    const usagePercent = (current: number, limit: number) => (current / limit) * 100;
    
    if (usagePercent(teamData.monthlyQuickContent, planLimits.quickContentCreations) > 80) {
      warnings.push('Próximo do limite de criações rápidas mensais');
    }
    
    if (usagePercent(teamData.monthlyCustomContent, planLimits.customContentSuggestions) > 80) {
      warnings.push('Próximo do limite de sugestões personalizadas mensais');
    }
    
    if (usagePercent(teamData.monthlyPlans, planLimits.contentPlans) > 80) {
      warnings.push('Próximo do limite de planejamentos mensais');
    }
    
    if (usagePercent(teamData.monthlyReviews, planLimits.contentReviews) > 80) {
      warnings.push('Próximo do limite de revisões mensais');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;