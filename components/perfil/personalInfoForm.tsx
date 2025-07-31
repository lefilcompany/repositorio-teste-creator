// components/perfil/personalInfoForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import ChangePasswordDialog from './changePasswordDialog';

interface PersonalInfoFormProps {
  initialData: {
    fullName: string;
    email: string;
    phone: string;
    state: string;
    city: string;
  };
}

interface State {
  id: number;
  sigla: string;
  nome: string;
}

interface City {
  id: number;
  nome: string;
}

export default function PersonalInfoForm({ initialData }: PersonalInfoFormProps) {
  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  // Fetch states from IBGE API
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then((data: State[]) => {
        setStates(data);
        setLoadingStates(false);
      })
      .catch(error => {
        console.error("Erro ao buscar estados:", error);
        setLoadingStates(false);
      });
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    if (formData.state) {
      setLoadingCities(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`)
        .then(res => res.json())
        .then((data: City[]) => {
          setCities(data);
          setLoadingCities(false);
        })
        .catch(error => {
          console.error("Erro ao buscar cidades:", error);
          setLoadingCities(false);
        });
    }
  }, [formData.state]);

  const handleSave = () => {
    setIsSaving(true);
    // Simula uma chamada de API
    setTimeout(() => {
      console.log('Dados salvos:', formData);
      setIsSaving(false);
    }, 1500);
  };

  return (
    <>
      <Card className="h-full shadow-lg border-2 border-primary/10">
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
          <CardDescription>Atualize suas informações de contato e localização.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={formData.email} disabled className="cursor-not-allowed bg-muted/50" />
              <p className="text-xs text-muted-foreground">Este campo não é editável.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select value={formData.state} onValueChange={(value) => setFormData({...formData, state: value, city: ''})} disabled={loadingStates}>
                    <SelectTrigger>{loadingStates ? 'Carregando...' : <SelectValue placeholder="Selecione um estado" />}</SelectTrigger>
                    <SelectContent>
                        {states.map(state => <SelectItem key={state.id} value={state.sigla}>{state.nome}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Select value={formData.city} onValueChange={(value) => setFormData({...formData, city: value})} disabled={!formData.state || loadingCities}>
                    <SelectTrigger>{loadingCities ? 'Carregando...' : <SelectValue placeholder="Selecione uma cidade" />}</SelectTrigger>
                    <SelectContent>
                        {cities.map(city => <SelectItem key={city.id} value={city.nome}>{city.nome}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)} className="w-full sm:w-auto">Alterar Senha</Button>
            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto flex-1 bg-gradient-to-r from-primary to-secondary">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <ChangePasswordDialog isOpen={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen} />
    </>
  );
}