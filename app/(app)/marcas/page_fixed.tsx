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
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.teamId) {
        setIsLoadingBrands(false);
        setIsLoadingTeam(false);
        return;
      }

      try {
        // Carregar marcas
        const brandsRes = await fetch(`/api/brands?teamId=${user.teamId}`);
        if (brandsRes.ok) {
          const data: Brand[] = await brandsRes.json();
          setBrands(data);
        } else {
          const error = await brandsRes.json();
          console.error('Falha ao carregar marcas:', error.error);
          toast.error('Erro ao carregar marcas da equipe');
        }
      } catch (error) {
        console.error('Falha ao carregar marcas', error);
        toast.error('Erro de conexão ao carregar marcas');
      } finally {
        setIsLoadingBrands(false);
      }

      try {
        // Carregar dados do team
        const teamRes = await fetch(`/api/teams?userId=${user.id}`);
        if (teamRes.ok) {
          const teamsData: Team[] = await teamRes.json();
          const currentTeam = teamsData.find(t => t.id === user.teamId);
          if (currentTeam) setTeam(currentTeam);
        } else {
          console.error('Falha ao carregar dados da equipe');
          toast.error('Erro ao carregar dados da equipe');
        }
      } catch (error) {
        console.error('Falha ao carregar dados da equipe', error);
        toast.error('Erro de conexão ao carregar dados da equipe');
      } finally {
        setIsLoadingTeam(false);
      }
    };
    load();
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
    if (!user?.teamId || !user.id) return;
    try {
      const method = brandToEdit ? 'PUT' : 'POST';
      const url = brandToEdit ? `/api/brands/${brandToEdit.id}` : '/api/brands';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, teamId: user.teamId, userId: user.id }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        console.error('Falha ao salvar marca:', error.error);
        toast.error(error.error || 'Erro ao salvar marca');
        throw new Error(error.error || 'Falha ao salvar marca');
      }
      
      const saved: Brand = await res.json();
      setBrands(prev =>
        brandToEdit ? prev.map(b => (b.id === saved.id ? saved : b)) : [...prev, saved]
      );
      if (brandToEdit && selectedBrand?.id === saved.id) {
        setSelectedBrand(saved);
      }
      
      toast.success(brandToEdit ? 'Marca atualizada com sucesso!' : 'Marca criada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar marca:', error);
      toast.error('Erro ao salvar marca. Tente novamente.');
    }
  }, [brandToEdit, selectedBrand?.id, user]);

  const handleDeleteBrand = useCallback(async () => {
    if (!selectedBrand || !user?.teamId || !user?.id) return;
    try {
      const res = await fetch(`/api/brands/${selectedBrand.id}?teamId=${user.teamId}&userId=${user.id}`, { 
        method: 'DELETE' 
      });
      if (res.ok) {
        setBrands(prev => prev.filter(b => b.id !== selectedBrand.id));
        setSelectedBrand(null);
        toast.success('Marca deletada com sucesso!');
      } else {
        const error = await res.json();
        console.error('Falha ao deletar marca:', error.error);
        toast.error(error.error || 'Erro ao deletar marca');
      }
    } catch (error) {
      console.error('Falha ao deletar marca', error);
      toast.error('Erro ao deletar marca. Tente novamente.');
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
