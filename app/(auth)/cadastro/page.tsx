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
import { Loader2, User as UserIcon, Mail, Lock, Phone } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

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

  const [teamStep, setTeamStep] = useState<'none' | 'choice' | 'create' | 'join' | 'pending'>('none');
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [teamError, setTeamError] = useState('');

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
        toast.error('Erro ao carregar estados');
      });
  }, []);

  // Busca as cidades sempre que um estado é selecionado
  useEffect(() => {
    if (formData.state) {
      setLoadingCities(true);
      setCities([]); // Limpa as cidades anteriores
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`)
        .then(res => res.json())
        .then((data: City[]) => {
          setCities(data);
          setLoadingCities(false);
        })
        .catch(err => {
          console.error("Erro ao buscar cidades:", err);
          setLoadingCities(false);
          toast.error('Erro ao carregar cidades');
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
      updatedData.city = '';
    }
    setFormData(updatedData);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Ocorreu um erro ao tentar se cadastrar.');
        toast.error(data.error || 'Erro no cadastro');
        setIsLoading(false);
        return;
      }
      const user = await res.json();
      setPendingUser(user);
      setTeamStep('choice');
      toast.success('Cadastro realizado com sucesso!');
    } catch (err) {
      setError('Ocorreu um erro ao tentar se cadastrar.');
      toast.error('Erro de conexão durante o cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!pendingUser) return;
    
    if (!teamName.trim() || !teamCode.trim()) {
      toast.error('Por favor, preencha o nome e código da equipe');
      return;
    }
    
    try {
      const freePlan = {
        name: 'Free',
        limits: {
          members: 5,
          brands: 1,
          themes: 3,
          personas: 2,
          calendars: 1,
          contentSuggestions: 20,
          contentReviews: 20,
        },
      };
      const res = await fetch('/api/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pendingUser.id,
          name: teamName,
          code: teamCode,
          plan: freePlan,
          credits: {
            contentSuggestions: freePlan.limits.contentSuggestions,
            contentReviews: freePlan.limits.contentReviews,
            contentPlans: freePlan.limits.calendars,
          },
        }),
      });
      
      if (res.ok) {
        toast.success('Equipe criada com sucesso!');
        router.push('/login');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao criar equipe');
      }
    } catch (error) {
      toast.error('Erro de conexão ao criar equipe');
    }
  };

  const handleJoinTeam = async () => {
    if (!pendingUser) return;
    
    if (!joinCode.trim()) {
      toast.error('Por favor, digite o código da equipe');
      return;
    }
    
    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: pendingUser.id, code: joinCode }),
      });
      if (!res.ok) {
        const data = await res.json();
        setTeamError(data.error || 'Falha ao entrar na equipe.');
        toast.error(data.error || 'Código de equipe inválido');
        return;
      }
      setTeamStep('pending');
      toast.success('Solicitação enviada! Aguarde aprovação do administrador.');
    } catch (error) {
      toast.error('Erro de conexão ao solicitar entrada na equipe');
    }
  };

  return (
    <>
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      {/* Coluna Esquerda: Formulário de Cadastro */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Crie sua Conta</h1>
            <p className="text-muted-foreground mt-2">
              É rápido e fácil. Vamos começar!
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="name" placeholder="Nome Completo" required value={formData.name} onChange={handleInputChange} className="pl-10 h-12" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="email" type="email" placeholder="E-mail" required value={formData.email} onChange={handleInputChange} className="pl-10 h-12" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="password" type="password" placeholder="Senha (mínimo 6 caracteres)" required minLength={6} value={formData.password} onChange={handleInputChange} className="pl-10 h-12" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="phone" type="tel" placeholder="Telefone (Opcional)" value={formData.phone} onChange={handleInputChange} className="pl-10 h-12" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state" className="text-muted-foreground text-xs">Estado</Label>
                <Select value={formData.state} onValueChange={(value) => handleSelectChange('state', value)} disabled={loadingStates}>
                  <SelectTrigger className="h-12">{loadingStates ? 'Carregando...' : <SelectValue placeholder="Selecione" />}</SelectTrigger>
                  <SelectContent>
                    {states.map(state => <SelectItem key={state.id} value={state.sigla}>{state.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-muted-foreground text-xs">Cidade</Label>
                <Select value={formData.city} onValueChange={(value) => handleSelectChange('city', value)} disabled={!formData.state || loadingCities}>
                  <SelectTrigger className="h-12">{loadingCities ? 'Carregando...' : <SelectValue placeholder="Selecione" />}</SelectTrigger>
                  <SelectContent>
                    {cities.map(city => <SelectItem key={city.id} value={city.nome}>{city.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button type="submit" className="w-full rounded-lg text-base py-6 bg-gradient-to-r from-primary to-secondary font-bold tracking-wider" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'CRIAR CONTA'}
            </Button>
          </form>
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Já tem uma conta? </span>
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Conecte-se
            </Link>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Showcase */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-primary to-secondary text-white text-center">
        <div className="max-w-md space-y-4">
          <Image
            src="/assets/logoCreatorPreta.png"
            alt="Creator Logo"
            width={200}
            height={55}
            className="mx-auto invert brightness-0"
          />
          <h2 className="text-4xl font-bold mt-6">Transforme Ideias em Conteúdo</h2>
          <p className="mt-4 text-white/80 text-lg">
            Junte-se à nossa comunidade e comece a criar posts incríveis com o poder da inteligência artificial.
          </p>
        </div>
      </div>
    </div>

    <AlertDialog open={teamStep === 'choice'} onOpenChange={() => {}}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Participar de uma equipe</AlertDialogTitle>
          <AlertDialogDescription>
            Você deseja criar uma nova equipe ou entrar em uma existente?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setTeamStep('create')}>Criar equipe</AlertDialogAction>
          <AlertDialogAction onClick={() => setTeamStep('join')}>Entrar em equipe</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={teamStep === 'create'} onOpenChange={() => {}}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Nova equipe</AlertDialogTitle>
          <AlertDialogDescription>Informe o nome e código de acesso.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-2">
          <Input placeholder="Nome da equipe" value={teamName} onChange={e => setTeamName(e.target.value)} />
          <Input placeholder="Código de acesso" value={teamCode} onChange={e => setTeamCode(e.target.value)} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setTeamStep('choice')}>Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={handleCreateTeam}>Criar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={teamStep === 'join'} onOpenChange={() => {}}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Entrar em equipe</AlertDialogTitle>
          <AlertDialogDescription>Insira o código da equipe.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-2">
          <Input placeholder="Código da equipe" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
          {teamError && <p className="text-sm text-destructive">{teamError}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setTeamStep('choice')}>Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={handleJoinTeam}>Enviar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={teamStep === 'pending'} onOpenChange={() => {}}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Solicitação enviada</AlertDialogTitle>
          <AlertDialogDescription>
            Aguarde o administrador aprovar sua entrada na equipe.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => router.push('/login')}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    </>
  );
}