// components/marcas/BrandList.tsx
'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Brand } from '@/types/brand';

interface BrandListProps {
  brands: Brand[];
  selectedBrand: Brand | null;
  onSelectBrand: (brand: Brand) => void;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

export default function BrandList({ brands, selectedBrand, onSelectBrand }: BrandListProps) {
  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => a.name.localeCompare(b.name));
  }, [brands]);

  return (
    <div className="lg:col-span-2 bg-card p-4 md:p-6 rounded-2xl border-2 border-primary/10 flex flex-col h-full overflow-hidden">
      <h2 className="text-2xl font-semibold text-foreground mb-4 px-2 flex-shrink-0">Todas as marcas</h2>
      <div className="overflow-y-auto pr-2 flex-grow">
        <ul className="space-y-3">
          {sortedBrands.map((brand) => (
            <li key={brand.id}>
              <button
                onClick={() => onSelectBrand(brand)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between",
                  selectedBrand?.id === brand.id
                    ? "bg-primary/10 border-primary shadow-md"
                    : "bg-muted/50 border-transparent hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-primary to-secondary text-white rounded-lg w-10 h-10 flex items-center justify-center font-bold text-xl mr-4">
                    {brand.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-foreground">{brand.name}</p>
                    <p className="text-sm text-muted-foreground">Responsável: {brand.responsible}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground hidden md:block">
                  Criado em: {formatDate(brand.createdAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}