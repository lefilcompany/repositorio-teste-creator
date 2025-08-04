// app/(auth)/cadastro/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from '@/types/user';
import { Loader2 } from 'lucide-react';

// Interfaces para os dados do IBGE
interface State {
  id: number;
  sigla: string;
  nome: string;
}

interface City {
  id: number;
  nome: string;
}

export default function CadastroPage() {
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    password: '',
    phone: '',
    state: '',
    city: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  // Busca os estados do Brasil na API do IBGE
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then((data: State[]) => {
        setStates(data);
        setLoadingStates(false);
      })
      .catch(err => {
        console.error("Erro ao buscar estados:", err);
        setLoadingStates(false);
      });
  }, []);

  // Busca as cidades sempre que um estado é selecionado
  useEffect(() => {
    if (formData.state) {
      setLoadingCities(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`)
        .then(res => res.json())
        .then((data: City[]) => {
          setCities(data);
          setLoadingCities(false);
        })
        .catch(err => {
          console.error("Erro ao buscar cidades:", err);
          setLoadingCities(false);
        });
    }
  }, [formData.state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: 'state' | 'city', value: string) => {
    const updatedData: Partial<User> = { ...formData, [field]: value };
    if (field === 'state') {
      updatedData.city = ''; // Reseta a cidade ao mudar o estado
    }
    setFormData(updatedData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      try {
        const storedUsers = JSON.parse(localStorage.getItem('creator-users') || '[]') as User[];
        const userExists = storedUsers.some(user => user.email === formData.email);

        if (userExists) {
          setError('Este e-mail já está em uso.');
          setIsLoading(false);
          return;
        }

        // Salva o novo usuário com todos os campos
        storedUsers.push(formData as User);
        localStorage.setItem('creator-users', JSON.stringify(storedUsers));

        router.push('/login');
      } catch (err) {
        setError('Ocorreu um erro ao tentar se cadastrar.');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Image
            src="/assets/logoCreatorPreta.png"
            alt="Creator Logo"
            width={180}
            height={48}
            className="mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-foreground">Crie sua conta</h1>
          <p className="text-muted-foreground">
            Comece a criar conteúdos incríveis em segundos.
          </p>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" required value={formData.name} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={formData.email} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required minLength={6} value={formData.password} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" type="tel" placeholder="(81) 99999-9999" value={formData.phone} onChange={handleInputChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Select value={formData.state} onValueChange={(value) => handleSelectChange('state', value)} disabled={loadingStates}>
                <SelectTrigger>{loadingStates ? 'Carregando...' : <SelectValue placeholder="Selecione" />}</SelectTrigger>
                <SelectContent>
                  {states.map(state => <SelectItem key={state.id} value={state.sigla}>{state.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Select value={formData.city} onValueChange={(value) => handleSelectChange('city', value)} disabled={!formData.state || loadingCities}>
                <SelectTrigger>{loadingCities ? 'Carregando...' : <SelectValue placeholder="Selecione" />}</SelectTrigger>
                <SelectContent>
                  {cities.map(city => <SelectItem key={city.id} value={city.nome}>{city.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full rounded-full text-base py-6" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : 'Criar conta'}
          </Button>
        </form>
        <div className="text-center text-sm">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Faça login
          </Link>
        </div>
      </div>
    </div>
  );
}