'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Tag } from 'lucide-react';
import BrandList from '@/components/marcas/brandList';
import BrandDetails from '@/components/marcas/brandDetails';
import BrandDialog from '@/components/marcas/brandDialog';
import type { Brand } from '@/types/brand';

// Definindo o tipo para os dados do formulário, que é um Brand parcial
type BrandFormData = Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>;

export default function MarcasPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);

  useEffect(() => {
    try {
      const storedBrands = localStorage.getItem('creator-brands');
      if (storedBrands) {
        setBrands(JSON.parse(storedBrands));
      }
    } catch (error) {
      console.error("Falha ao carregar as marcas do localStorage", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('creator-brands', JSON.stringify(brands));
      } catch (error) {
        console.error("Falha ao salvar as marcas no localStorage", error);
      }
    }
  }, [brands, isLoaded]);

  const handleOpenDialog = useCallback((brand: Brand | null = null) => {
    setBrandToEdit(brand);
    setIsDialogOpen(true);
  }, []);

  const handleSaveBrand = useCallback((formData: BrandFormData) => {
    const now = new Date().toISOString();

    setBrands(prevBrands => {
      if (brandToEdit) {
        const updatedBrands = prevBrands.map(b =>
          b.id === brandToEdit.id ? { ...b, ...formData, updatedAt: now } : b
        );
        if (selectedBrand?.id === brandToEdit.id) {
          setSelectedBrand(prev => prev ? { ...prev, ...formData, updatedAt: now } : null);
        }
        return updatedBrands;
      } else {
        const newBrand: Brand = {
          id: now,
          ...formData, // Adiciona todos os campos do formulário
          createdAt: now,
          updatedAt: now,
        };
        return [...prevBrands, newBrand];
      }
    });
  }, [brandToEdit, selectedBrand?.id]);

  const handleDeleteBrand = useCallback(() => {
    if (!selectedBrand) return;
    setBrands(prevBrands => prevBrands.filter(b => b.id !== selectedBrand.id));
    setSelectedBrand(null);
  }, [selectedBrand]);

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