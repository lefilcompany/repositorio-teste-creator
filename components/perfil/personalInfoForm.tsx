// components/perfil/personalInfoForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User as UserIcon } from 'lucide-react';
import ChangePasswordDialog from './changePasswordDialog';
import { User } from '@/types/user';
import { toast } from 'sonner';

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
      })
      .catch(error => {
        console.error('Erro ao carregar estados:', error);
        toast.error('Erro ao carregar lista de estados');
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
        })
        .catch(error => {
          console.error('Erro ao carregar cidades:', error);
          toast.error('Erro ao carregar lista de cidades');
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
      <Card className="shadow-md border border-primary/20 bg-gradient-to-br from-background via-background/95 to-muted/10 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg border-b border-primary/20 p-6">
          <CardTitle className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/15 rounded-xl shadow-sm">
              <UserIcon className="h-6 w-6 text-primary" />
            </div>
            Dados Pessoais
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            Atualize suas informações de contato e localização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Nome Completo
              </Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                className="h-11 border border-primary/30 focus:border-primary/60 rounded-lg bg-background/90 transition-all text-base"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-muted rounded-full"></div>
                Email
              </Label>
              <Input 
                id="email" 
                value={formData.email || ''} 
                disabled 
                className="h-11 cursor-not-allowed bg-muted/50 border border-muted/50 rounded-lg text-base"
              />
              <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md text-center">
                Este campo não é editável por segurança
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label htmlFor="phone" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                Telefone
              </Label>
              <Input 
                id="phone" 
                value={formData.phone || ''} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                className="h-11 border border-accent/30 focus:border-accent/60 rounded-lg bg-background/90 transition-all text-base"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="state" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                Estado
              </Label>
              <Select 
                value={formData.state || ''} 
                onValueChange={(value) => setFormData({ ...formData, state: value, city: '' })} 
                disabled={loadingStates}
              >
                <SelectTrigger className="h-11 border border-secondary/30 focus:border-secondary/60 rounded-lg bg-background/90 text-base">
                  {loadingStates ? 'Carregando...' : <SelectValue placeholder="Selecione um estado" />}
                </SelectTrigger>
                <SelectContent>
                  {states.map(state => (
                    <SelectItem key={state.id} value={state.sigla} className="text-base">
                      {state.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="city" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                Cidade
              </Label>
              <Select 
                value={formData.city || ''} 
                onValueChange={(value) => setFormData({ ...formData, city: value })} 
                disabled={!formData.state || loadingCities}
              >
                <SelectTrigger className="h-11 border border-success/30 focus:border-success/60 rounded-lg bg-background/90 text-base">
                  {loadingCities ? 'Carregando...' : <SelectValue placeholder="Selecione uma cidade" />}
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city.id} value={city.nome} className="text-base">
                      {city.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-primary/20">
            <Button 
              variant="outline" 
              onClick={() => setIsPasswordDialogOpen(true)} 
              className="w-full sm:w-auto h-11 bg-gradient-to-r from-accent/10 to-secondary/10 border border-accent/30 hover:border-accent/50 hover:bg-gradient-to-r hover:from-accent/20 hover:to-secondary/20 text-foreground font-medium rounded-lg transition-all text-base"
            >
              Alterar Senha
            </Button>
            <Button 
              onClick={handleSaveClick} 
              disabled={isSaving} 
              className="w-full sm:w-auto flex-1 h-11 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 text-base"
            >
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