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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { User } from '@/types/user';
import { Loader2, User as UserIcon, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import TeamDialog from '@/components/teamDialog';

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  // Consentimento de política de privacidade
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Validações de senha
  const passwordsMatch = formData.password === confirmPassword;
  const isPasswordValid = formData.password && formData.password.length >= 6;

  // Busca os estados do Brasil na API do IBGE
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then((data: State[]) => {
        setStates(data);
        setLoadingStates(false);
      })
      .catch(err => {
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
          setLoadingCities(false);
          toast.error('Erro ao carregar cidades');
        });
    }
  }, [formData.state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === 'phone') {
      // Formatação do telefone: (XX) XXXXX-XXXX
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      
      if (cleaned.length >= 1) {
        formatted = `(${cleaned.substring(0, 2)}`;
      }
      if (cleaned.length >= 3) {
        formatted += `) ${cleaned.substring(2, 7)}`;
      }
      if (cleaned.length >= 8) {
        formatted += `-${cleaned.substring(7, 11)}`;
      }
      
      setFormData(prev => ({ ...prev, [id]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
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
    // Validações
    if (!privacyChecked || !privacyAccepted) {
      setError('É necessário aceitar a Política de Privacidade para se cadastrar.');
      toast.error('É necessário aceitar a Política de Privacidade para se cadastrar.');
      return;
    }
    if (formData.password !== confirmPassword) {
      setError('As senhas não coincidem');
      toast.error('As senhas não coincidem');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }
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
      setTeamDialogOpen(true);
      toast.success('Cadastro realizado com sucesso!');
    } catch (err) {
      setError('Ocorreu um erro ao tentar se cadastrar.');
      toast.error('Erro de conexão durante o cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      {/* Coluna Esquerda: Formulário de Cadastro */}
      <div className="flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Crie sua Conta</h1>
            <p className="text-muted-foreground mt-2">
              É rápido e fácil. Vamos começar!
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="name" placeholder="Nome Completo" required value={formData.name} onChange={handleInputChange} className="pl-10 h-12" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="email" type="email" placeholder="E-mail" required value={formData.email} onChange={handleInputChange} className="pl-10 h-12" />
            </div>
            {/* Campos de senha lado a lado */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Senha" 
                  required 
                  minLength={6} 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  className="pl-10 pr-12 h-12" 
                />
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </Button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="confirmPassword" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Confirmar Senha" 
                  required 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="pl-10 h-12" 
                />
              </div>
            </div>
            {/* Indicadores de validação da senha */}
            {formData.password && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200/50 shadow-md">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all ${
                      isPasswordValid ? 'bg-green-500 shadow-sm' : 'bg-red-500'
                    }`}>
                      {isPasswordValid && <span className="text-white text-[10px]">✓</span>}
                    </div>
                    <span className={`font-medium transition-colors ${
                      isPasswordValid ? 'text-green-700' : 'text-red-500'
                    }`}>
                      Mínimo 6 caracteres
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all ${
                      passwordsMatch && confirmPassword ? 'bg-green-500 shadow-sm' : 'bg-red-500'
                    }`}>
                      {passwordsMatch && confirmPassword && <span className="text-white text-[10px]">✓</span>}
                    </div>
                    <span className={`font-medium transition-colors ${
                      passwordsMatch && confirmPassword ? 'text-green-700' : 'text-red-500'
                    }`}>
                      Senhas coincidem
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="phone" type="tel" placeholder="(XX) XXXXX-XXXX" value={formData.phone} onChange={handleInputChange} className="pl-10 h-12" maxLength={15} />
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
            {/* Checkbox de política de privacidade */}
            <div className="flex items-center gap-2 mt-2">
              <Checkbox id="privacy" checked={privacyChecked} onCheckedChange={(checked) => {
                if (checked) {
                  setPrivacyModalOpen(true);
                } else {
                  setPrivacyChecked(false);
                  setPrivacyAccepted(false);
                }
              }} />
              <Label htmlFor="privacy" className="text-xs text-muted-foreground select-none cursor-pointer">
                Li e concordo com a <button type="button" className="underline text-primary hover:text-secondary transition-colors" onClick={() => setPrivacyModalOpen(true)}>Política de Privacidade</button>
              </Label>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button
              type="submit"
              className="w-full rounded-lg text-base py-5 bg-gradient-to-r from-primary to-secondary font-bold tracking-wider"
              disabled={
                isLoading ||
                !formData.name ||
                !formData.email ||
                !formData.password ||
                !confirmPassword ||
                !privacyChecked ||
                !privacyAccepted
              }
            >
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
            src="/assets/logoCreatorBranca.png"
            alt="Creator Logo"
            width={200}
            height={55}
            className="mx-auto"
          />
          <h2 className="text-4xl font-bold mt-6">Transforme Ideias em Conteúdo</h2>
          <p className="mt-4 text-white/80 text-lg">
            Junte-se à nossa comunidade e comece a criar posts incríveis com o poder da inteligência artificial.
          </p>
        </div>
      </div>
    </div>
    {/* Modal de Política de Privacidade */}
    <Dialog open={privacyModalOpen} onOpenChange={setPrivacyModalOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Política de Privacidade – Uso de Dados e IA</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground max-h-72 overflow-y-auto">
          <p>👋 Olá! Antes de usar nossa plataforma, é importante que você saiba como cuidamos dos seus dados:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><b>O que coletamos:</b> informações de cadastro (nome, e-mail, telefone), dados de navegação, histórico de uso e, quando necessário, informações de pagamento.</li>
            <li><b>Como usamos:</b> para oferecer e melhorar os serviços, personalizar sua experiência, enviar novidades e cumprir obrigações legais.</li>
            <li><b>Inteligência Artificial:</b> usamos IA para recomendar conteúdos, apoiar no suporte e ajudar na criação de materiais. Mas sempre com transparência e sem usar dados sensíveis sem sua permissão.</li>
            <li><b>Compartilhamento:</b> nunca vendemos seus dados. Só compartilhamos com parceiros essenciais para o funcionamento da plataforma ou quando a lei exigir.</li>
            <li><b>Seus direitos:</b> você pode pedir acesso, correção, exclusão ou portabilidade dos seus dados, além de cancelar comunicações de marketing a qualquer momento.</li>
            <li><b>Segurança:</b> seus dados ficam protegidos com medidas avançadas de segurança e só são armazenados pelo tempo necessário.</li>
          </ul>
          <p className="mt-2">📌 Ao continuar, você concorda com nossa <a href="#" className="underline text-primary">Política de Privacidade completa</a>.</p>
        </div>
        <DialogFooter className="flex flex-row gap-2 justify-end mt-4">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setPrivacyModalOpen(false);
              setPrivacyChecked(false);
              setPrivacyAccepted(false);
            }}
          >
            Não aceito
          </Button>
          <Button
            type="button"
            className="bg-gradient-to-r from-primary to-secondary font-bold"
            onClick={() => {
              setPrivacyModalOpen(false);
              setPrivacyChecked(true);
              setPrivacyAccepted(true);
            }}
          >
            Aceito e concordo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <TeamDialog 
      isOpen={teamDialogOpen} 
      onClose={() => setTeamDialogOpen(false)} 
      user={pendingUser} 
      isFromLogin={false}
    />
    </>
  );
}
