// app/marcas/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Tag } from 'lucide-react';
import BrandList from '@/components/marcas/brandList'; // Caminho ajustado
import BrandDetails from '@/components/marcas/brandDetails'; // Caminho ajustado
import BrandDialog from '@/components/marcas/brandDialog'; // Caminho ajustado
import type { Brand } from '@/types/brand';

export default function MarcasPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);

  // ... (toda a lógica de useState e useEffect permanece a mesma) ...

  useEffect(() => {
    try {
      const storedBrands = localStorage.getItem('creator-brands');
      if (storedBrands) {
        setBrands(JSON.parse(storedBrands));
      }
    } catch (error) {
      console.error("Failed to load brands from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('creator-brands', JSON.stringify(brands));
    } catch (error) {
      console.error("Failed to save brands to localStorage", error);
    }
  }, [brands]);

  const handleOpenDialog = useCallback((brand: Brand | null = null) => {
    setBrandToEdit(brand);
    setIsDialogOpen(true);
  }, []);

  const handleSaveBrand = useCallback((formData: { name: string; responsible: string }) => {
    const now = new Date().toISOString();

    if (brandToEdit) {
      const updatedBrands = brands.map(b =>
        b.id === brandToEdit.id ? { ...b, ...formData, updatedAt: now } : b
      );
      setBrands(updatedBrands);
      if (selectedBrand?.id === brandToEdit.id) {
        setSelectedBrand(prev => prev ? { ...prev, ...formData, updatedAt: now } : null);
      }
    } else {
      const newBrand: Brand = {
        id: now,
        name: formData.name,
        responsible: formData.responsible,
        createdAt: now,
        updatedAt: now,
      };
      setBrands(prevBrands => [...prevBrands, newBrand]);
    }
  }, [brandToEdit, brands, selectedBrand?.id]);

  const handleDeleteBrand = useCallback(() => {
    if (!selectedBrand) return;
    setBrands(brands.filter(b => b.id !== selectedBrand.id));
    setSelectedBrand(null);
  }, [selectedBrand, brands]);


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
        <Button onClick={() => handleOpenDialog()} className="mt-4 md:mt-0 rounded-full px-6 py-5 text-base">
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