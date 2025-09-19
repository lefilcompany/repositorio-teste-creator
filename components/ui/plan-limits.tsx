'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Team } from '@/types/team';

interface PlanLimitsProps {
  team: Team;
  currentCounts: {
    brands: number;
    themes: number;
    personas: number;
  };
  entityType?: 'brands' | 'themes' | 'personas';
}

export function PlanLimits({ team, currentCounts, entityType }: PlanLimitsProps) {
  if (!team.plan) {
    return null;
  }

  const plan = team.plan;
  
  const getEntityInfo = (type: keyof typeof currentCounts) => {
    const current = currentCounts[type];
    let limit: number;
    
    // Mapear os campos para os novos
    switch(type) {
      case 'brands': limit = plan.maxBrands; break;
      case 'themes': limit = plan.maxStrategicThemes; break;
      case 'personas': limit = plan.maxPersonas; break;
      default: limit = 0;
    }
    
    const percentage = (current / limit) * 100;
    
    return {
      current,
      limit,
      percentage,
      isAtLimit: current >= limit
    };
  };

  const entities = [
    { key: 'brands' as const, label: 'Marcas', icon: '🏢' },
    { key: 'themes' as const, label: 'Temas', icon: '🎯' },
    { key: 'personas' as const, label: 'Personas', icon: '👥' }
  ];

  // Se um tipo específico foi passado, mostrar apenas informações resumidas
  if (entityType) {
    const info = getEntityInfo(entityType);
    const entity = entities.find(e => e.key === entityType);
    
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{entity?.icon}</span>
              <span className="text-sm font-medium">Plano {team.plan.name}</span>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              info.isAtLimit 
                ? 'bg-destructive/10 text-destructive' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {info.current}/{info.limit} {entity?.label}
            </div>
          </div>
          {info.isAtLimit && (
            <p className="text-xs text-muted-foreground mt-2">
              Limite atingido. Considere fazer upgrade do seu plano.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Mostrar informações completas
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Limites do Plano {team.plan.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entities.map(({ key, label, icon }) => {
          const info = getEntityInfo(key);
          
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  info.isAtLimit 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {info.current}/{info.limit}
                </div>
              </div>
              <Progress value={info.percentage} className="h-2" />
              {info.isAtLimit && (
                <p className="text-xs text-muted-foreground">
                  Limite atingido para {label.toLowerCase()}
                </p>
              )}
            </div>
          );
        })}
        
        <div className="pt-2 border-t border-border/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Créditos Conteúdo</p>
              <p className="text-sm font-semibold">{team.credits?.contentSuggestions || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Créditos Revisão</p>
              <p className="text-sm font-semibold">{team.credits?.contentReviews || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Calendários</p>
              <p className="text-sm font-semibold">{team.credits?.contentPlans || 0}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
