'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Tag } from 'lucide-react';
import BrandList from '@/components/marcas/brandList';
import BrandDetails from '@/components/marcas/brandDetails';
import BrandDialog from '@/components/marcas/brandDialog';
import type { Brand } from '@/types/brand';
import { useAuth } from '@/hooks/useAuth';

// Definindo o tipo para os dados do formulário, que é um Brand parcial
type BrandFormData = Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'teamId' | 'userId'>;

export default function MarcasPage() {
  const { user } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.teamId) return;
      try {
        const res = await fetch(`/api/brands?teamId=${user.teamId}`);
        if (res.ok) {
          const data: Brand[] = await res.json();
          setBrands(data);
        } else {
          const error = await res.json();
          console.error('Falha ao carregar marcas:', error.error);
        }
      } catch (error) {
        console.error('Falha ao carregar marcas', error);
      }
    };
    load();
  }, [user]);

  const handleOpenDialog = useCallback((brand: Brand | null = null) => {
    setBrandToEdit(brand);
    setIsDialogOpen(true);
  }, []);

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
        throw new Error(error.error || 'Falha ao salvar marca');
      }
      
      const saved: Brand = await res.json();
      setBrands(prev =>
        brandToEdit ? prev.map(b => (b.id === saved.id ? saved : b)) : [...prev, saved]
      );
      if (brandToEdit && selectedBrand?.id === saved.id) {
        setSelectedBrand(saved);
      }
    } catch (error) {
      console.error('Erro ao salvar marca:', error);
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
      } else {
        const error = await res.json();
        console.error('Falha ao deletar marca:', error.error);
      }
    } catch (error) {
      console.error('Falha ao deletar marca', error);
    }
  }, [selectedBrand, user]);

  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center flex-shrink-0">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
            <Tag className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Suas Marcas
            </h1>
            <p className="text-muted-foreground">
              Gerencie, edite ou crie novas marcas para seus projetos.
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="mt-4 md:mt-0 rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-5 text-base">
          <Plus className="mr-2 h-5 w-5" />
          Nova marca
        </Button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow overflow-hidden">
        <BrandList
          brands={brands}
          selectedBrand={selectedBrand}
          onSelectBrand={setSelectedBrand}
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