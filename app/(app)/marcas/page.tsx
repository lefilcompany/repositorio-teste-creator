'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Tag } from 'lucide-react';
import BrandList from '@/components/marcas/brandList';
import BrandDetails from '@/components/marcas/brandDetails';
import BrandDialog from '@/components/marcas/brandDialog';
import type { Brand } from '@/types/brand';
import type { Team } from '@/types/team';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Definindo o tipo para os dados do formulário, que é um Brand parcial
type BrandFormData = Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'teamId' | 'userId'>;

export default function MarcasPage() {
  const { user } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);

  // Carrega marcas e dados da equipe via API
  useEffect(() => {
    const loadData = async () => {
      if (!user?.teamId) return;
      
      try {
        // Carrega marcas
        const brandsRes = await fetch(`/api/brands?teamId=${user.teamId}`);
        if (brandsRes.ok) {
          const brandsData: Brand[] = await brandsRes.json();
          setBrands(brandsData);
        } else {
          toast.error('Erro ao carregar marcas');
        }
      } catch (error) {
        toast.error('Erro de conexão ao carregar marcas');
      } finally {
        setIsLoadingBrands(false);
      }
    };
    
    loadData();
  }, [user]);

  useEffect(() => {
    const loadTeam = async () => {
      if (!user?.id) {
        setIsLoadingTeam(false);
        return;
      }
      try {
        const teamRes = await fetch(`/api/teams?userId=${user.id}`);
        if (teamRes.ok) {
          const teamsData: Team[] = await teamRes.json();
          const currentTeam = teamsData.find(t => t.id === user.teamId);
          if (currentTeam) setTeam(currentTeam);
        } else {
          toast.error('Erro ao carregar dados da equipe');
        }
      } catch (error) {
        toast.error('Erro de conexão ao carregar dados da equipe');
      } finally {
        setIsLoadingTeam(false);
      }
    };
    loadTeam();
  }, [user]);

  const handleOpenDialog = useCallback((brand: Brand | null = null) => {
    // Verificar limite antes de abrir o diálogo para nova marca
    if (!brand && team && typeof team.plan === 'object') {
      const planLimits = team.plan.limits;
      const currentBrandsCount = brands.length;
      const maxBrands = planLimits?.brands || 1;
      
      if (currentBrandsCount >= maxBrands) {
        toast.error(`Limite atingido! Seu plano ${team.plan.name} permite apenas ${maxBrands} marca${maxBrands > 1 ? 's' : ''}.`);
        return;
      }
    }
    
    setBrandToEdit(brand);
    setIsDialogOpen(true);
  }, [brands.length, team]);

  const handleSaveBrand = useCallback(async (formData: BrandFormData) => {
    if (!user?.teamId || !user.id) {
      toast.error('Usuário não autenticado ou sem equipe');
      return;
    }

    const toastId = 'brand-operation';
    try {
      toast.loading(brandToEdit ? 'Atualizando marca...' : 'Criando marca...', { id: toastId });
      
      const method = brandToEdit ? 'PUT' : 'POST';
      const url = brandToEdit ? `/api/brands/${brandToEdit.id}` : '/api/brands';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, teamId: user.teamId, userId: user.id }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Erro ao salvar marca', { id: toastId });
        throw new Error(error.error || 'Falha ao salvar marca');
      }
      
      const saved: Brand = await res.json();
      
      // Atualiza a lista de marcas
      setBrands(prev => {
        if (brandToEdit) {
          return prev.map(brand => brand.id === saved.id ? saved : brand);
        }
        return [...prev, saved];
      });
      
      // Atualiza a marca selecionada se necessário
      if (brandToEdit && selectedBrand?.id === saved.id) {
        setSelectedBrand(saved);
      } else if (!brandToEdit) {
        // Se for uma nova marca, seleciona ela automaticamente
        setSelectedBrand(saved);
      }
      
      toast.success(
        brandToEdit ? 'Marca atualizada com sucesso!' : 'Marca criada com sucesso!',
        { id: toastId }
      );
      
      return saved;
    } catch (error) {
      toast.error('Erro ao salvar marca. Tente novamente.', { id: toastId });
      throw error;
    }
  }, [brandToEdit, selectedBrand?.id, user]);

  const handleDeleteBrand = useCallback(async () => {
    if (!selectedBrand || !user?.teamId || !user?.id) {
      toast.error('Não foi possível deletar a marca. Verifique se você está logado.');
      return;
    }

    const toastId = 'brand-operation';
    try {
      toast.loading('Deletando marca...', { id: toastId });

      const res = await fetch(`/api/brands/${selectedBrand.id}?teamId=${user.teamId}&userId=${user.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Remove a marca da lista local e limpa a seleção
        setBrands(prev => prev.filter(brand => brand.id !== selectedBrand.id));
        setSelectedBrand(null);
        
        // Fecha o diálogo se estiver aberto
        setIsDialogOpen(false);
        setBrandToEdit(null);
        
        toast.success('Marca deletada com sucesso!', { id: toastId });
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erro ao deletar marca', { id: toastId });
      }
    } catch (error) {
      toast.error('Erro ao deletar marca. Tente novamente.', { id: toastId });
    }
  }, [selectedBrand, user]);

  // Verificar se o limite foi atingido
  const isAtBrandLimit = team && typeof team.plan === 'object' 
    ? brands.length >= (team.plan.limits?.brands || 1)
    : false;

  return (
    <div className="min-h-full flex flex-col gap-6">
      <Card className="shadow-lg border-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 flex-shrink-0">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <Tag className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  Suas Marcas
                </CardTitle>
                <p className="text-muted-foreground">
                  Gerencie, edite ou crie novas marcas para seus projetos.
                </p>
              </div>
            </div>
            <Button 
              onClick={() => handleOpenDialog()} 
              disabled={isAtBrandLimit || isLoadingTeam}
              className="rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="mr-2 h-5 w-5" />
              Nova marca
            </Button>
          </div>
        </CardHeader>
      </Card>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 flex-1">
        <BrandList
          brands={brands}
          selectedBrand={selectedBrand}
          onSelectBrand={setSelectedBrand}
          isLoading={isLoadingBrands}
        />
        <BrandDetails
          brand={selectedBrand}
          onEdit={handleOpenDialog}
          onDelete={handleDeleteBrand}
        />
      </main>

      <BrandDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveBrand}
        brandToEdit={brandToEdit}
      />
    </div>
  );
}

