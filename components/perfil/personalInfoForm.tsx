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
import { User } from '@/types/user';

interface PersonalInfoFormProps {
  initialData: Omit<User, 'password'>;
  onSave: (data: Omit<User, 'email' | 'password'>) => void;
  onSavePassword: (password: string) => void; // <-- ADICIONE ESTA LINHA
}

// Interfaces State e City (sem alterações)
interface State {
  id: number;
  sigla: string;
  nome: string;
}

interface City {
  id: number;
  nome: string;
}

// ** CORREÇÃO AQUI: Adicione onSavePassword aos parâmetros da função **
export default function PersonalInfoForm({ initialData, onSave, onSavePassword }: PersonalInfoFormProps) {
  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  // useEffects para buscar estados e cidades (sem alterações)
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then((data: State[]) => {
        setStates(data);
        setLoadingStates(false);
      });
  }, []);

  useEffect(() => {
    if (formData.state) {
      setLoadingCities(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`)
        .then(res => res.json())
        .then((data: City[]) => {
          setCities(data);
          setLoadingCities(false);
        });
    }
  }, [formData.state]);

  const handleSaveClick = () => {
    setIsSaving(true);
    const { email, ...dataToSave } = formData;

    setTimeout(() => {
      onSave(dataToSave);
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
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
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
              <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value, city: '' })} disabled={loadingStates}>
                <SelectTrigger>{loadingStates ? 'Carregando...' : <SelectValue placeholder="Selecione um estado" />}</SelectTrigger>
                <SelectContent>
                  {states.map(state => <SelectItem key={state.id} value={state.sigla}>{state.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })} disabled={!formData.state || loadingCities}>
                <SelectTrigger>{loadingCities ? 'Carregando...' : <SelectValue placeholder="Selecione uma cidade" />}</SelectTrigger>
                <SelectContent>
                  {cities.map(city => <SelectItem key={city.id} value={city.nome}>{city.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)} className="w-full sm:w-auto">Alterar Senha</Button>
            <Button onClick={handleSaveClick} disabled={isSaving} className="w-full sm:w-auto flex-1 bg-gradient-to-r from-primary to-secondary">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <ChangePasswordDialog
        isOpen={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
        onSavePassword={onSavePassword}
      />
    </>
  );
}