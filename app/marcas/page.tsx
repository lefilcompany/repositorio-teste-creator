// app/marcas/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipagem para os dados da Marca
interface Brand {
  id: string;
  name: string;
  responsible: string;
  createdAt: string;
}

// Dados iniciais para demonstração
const initialBrands: Brand[] = [
    { id: '1', name: 'Manolo Máquinas', responsible: 'Manolo', createdAt: '2025-07-05' },
    { id: '2', name: 'TecNova Solar', responsible: 'Paulo', createdAt: '2025-02-14' },
    { id: '3', name: 'Horizon Construções', responsible: 'Rodrigo', createdAt: '2025-01-25' },
    { id: '4', name: 'Naturaê', responsible: 'Diego', createdAt: '2024-08-07' },
    { id: '5', name: 'Gildo Lanches', responsible: 'Pâmela', createdAt: '2024-07-01' },
];

export default function MarcasPage() {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(brands[1]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);
  
  const [formData, setFormData] = useState({ name: '', responsible: '' });

  const handleSelectBrand = (brand: Brand) => {
    setSelectedBrand(brand);
  };
  
  const handleOpenDialog = (brand: Brand | null = null) => {
    setBrandToEdit(brand);
    setFormData(brand ? { name: brand.name, responsible: brand.responsible } : { name: '', responsible: '' });
    setIsDialogOpen(true);
  };
  
  const handleSaveBrand = () => {
    if (brandToEdit) {
      // Editar marca existente
      setBrands(brands.map(b => 
        b.id === brandToEdit.id ? { ...b, ...formData } : b
      ));
      if (selectedBrand?.id === brandToEdit.id) {
        setSelectedBrand({ ...selectedBrand, ...formData });
      }
    } else {
      // Criar nova marca
      const newBrand: Brand = {
        id: new Date().toISOString(), // ID único
        name: formData.name,
        responsible: formData.responsible,
        createdAt: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
      };
      setBrands([...brands, newBrand]);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteBrand = () => {
    if (!selectedBrand) return;
    setBrands(brands.filter(b => b.id !== selectedBrand.id));
    setSelectedBrand(null);
  };

  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => a.name.localeCompare(b.name));
  }, [brands]);

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="p-4 md:p-8 h-full bg-background/80">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Suas Marcas</h1>
          <p className="text-lg text-muted-foreground mt-1">Gerencie, edite ou crie novas marcas para seus projetos.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="mt-4 md:mt-0 rounded-full px-6 py-5 text-base">
          <Plus className="mr-2 h-5 w-5" />
          Nova marca
        </Button>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100%-120px)]">
        {/* Coluna da Lista de Marcas */}
        <div className="lg:col-span-2 bg-card p-4 md:p-6 rounded-2xl shadow-lg border-2 border-primary/10 flex flex-col h-full">
            <h2 className="text-2xl font-semibold text-foreground mb-4 px-2">Todas as marcas</h2>
            <div className="overflow-y-auto pr-2 flex-grow">
                <ul className="space-y-3">
                    {sortedBrands.map((brand) => (
                        <li key={brand.id}>
                            <button
                                onClick={() => handleSelectBrand(brand)}
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

        {/* Coluna de Detalhes da Marca */}
        <div className="lg:col-span-1 h-full">
            {selectedBrand ? (
                 <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border-2 border-secondary/20 h-full flex flex-col justify-between">
                     <div>
                        <div className="flex items-center mb-6">
                            <div className="bg-gradient-to-br from-secondary to-primary text-white rounded-xl w-16 h-16 flex items-center justify-center font-bold text-3xl mr-4">
                               {selectedBrand.name.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-2xl font-bold text-foreground break-words">{selectedBrand.name}</h2>
                        </div>
                        <div className="space-y-4 text-left">
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Responsável</p>
                                <p className="font-semibold text-foreground">{selectedBrand.responsible}</p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Data de Criação</p>
                                <p className="font-semibold text-foreground">{formatDate(selectedBrand.createdAt)}</p>
                            </div>
                        </div>
                     </div>
                     <div className="flex flex-col md:flex-row gap-3 mt-6">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button variant="outline" className="w-full flex-1 rounded-full py-5">
                                    <Trash2 className="mr-2 h-4 w-4"/> Deletar
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Essa ação não pode ser desfeita. Isso irá deletar permanentemente a marca "{selectedBrand.name}".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteBrand} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button onClick={() => handleOpenDialog(selectedBrand)} className="w-full flex-1 rounded-full py-5">
                            <Edit className="mr-2 h-4 w-4"/> Editar marca
                        </Button>
                     </div>
                </div>
            ) : (
                <div className="bg-card p-6 rounded-2xl shadow-lg border-2 border-dashed border-secondary/20 h-full flex flex-col items-center justify-center text-center">
                    <Tag className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">Nenhuma marca selecionada</h3>
                    <p className="text-muted-foreground">Selecione uma marca na lista para ver os detalhes ou crie uma nova.</p>
                </div>
            )}
        </div>
      </main>

      {/* Dialog para Criar/Editar Marca */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle>{brandToEdit ? 'Editar Marca' : 'Criar Nova Marca'}</DialogTitle>
                  <DialogDescription>
                      {brandToEdit ? 'Altere as informações da sua marca.' : 'Preencha os campos abaixo para adicionar uma nova marca.'}
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Nome</Label>
                      <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="col-span-3"
                          placeholder="Ex: TecNova Soluções"
                      />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="responsible" className="text-right">Responsável</Label>
                      <Input
                          id="responsible"
                          value={formData.responsible}
                          onChange={(e) => setFormData({...formData, responsible: e.target.value})}
                          className="col-span-3"
                          placeholder="Ex: Paulo"
                      />
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" onClick={handleSaveBrand}>Salvar</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}