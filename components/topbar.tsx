// components/topbar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Search, Bell, Settings, User, LogOut, Info, FileText, Shield, Loader2, Users, Palette, Tag } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface SearchResult {
  id: string;
  name: string;
  type: 'brand' | 'theme' | 'persona';
  description?: string;
}

export default function TopBar() {
  const { logout, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [searchCache, setSearchCache] = useState<Map<string, SearchResult[]>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Limpar cache periodicamente (a cada 5 minutos)
  useEffect(() => {
    const clearCacheInterval = setInterval(() => {
      setSearchCache(new Map());
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(clearCacheInterval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Cancelar pesquisa anterior se ainda estiver em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    // Verificar cache primeiro
    const cacheKey = searchQuery.toLowerCase().trim();
    if (searchCache.has(cacheKey)) {
      setSearchResults(searchCache.get(cacheKey) || []);
      setShowResults(true);
      setIsSearching(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      if (!user?.teamId) return;
      
      // Criar novo AbortController para esta pesquisa
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      
      setIsSearching(true);
      
      try {
        // Fazer todas as requisições em paralelo para maior velocidade
        const searchPromises = [
          fetch(`/api/brands?teamId=${user.teamId}&search=${encodeURIComponent(searchQuery)}`, { signal }),
          fetch(`/api/themes?teamId=${user.teamId}&search=${encodeURIComponent(searchQuery)}`, { signal }),
          fetch(`/api/personas?teamId=${user.teamId}&search=${encodeURIComponent(searchQuery)}`, { signal })
        ];

        const [brandsResponse, themesResponse, personasResponse] = await Promise.allSettled(searchPromises);

        // Verificar se a pesquisa foi cancelada
        if (signal.aborted) return;

        // Processar resultados apenas se as requisições foram bem-sucedidas
        let brands = [];
        let themes = [];
        let personas = [];

        try {
          brands = brandsResponse.status === 'fulfilled' && brandsResponse.value.ok 
            ? await brandsResponse.value.json() : [];
          themes = themesResponse.status === 'fulfilled' && themesResponse.value.ok 
            ? await themesResponse.value.json() : [];
          personas = personasResponse.status === 'fulfilled' && personasResponse.value.ok 
            ? await personasResponse.value.json() : [];
        } catch (parseError) {
          console.warn('Erro ao parsear JSON das APIs:', parseError);
          // Tentar requisições individuais simples como fallback
          try {
            const simpleBrands = await fetch(`/api/brands?teamId=${user.teamId}`, { signal });
            if (simpleBrands.ok) brands = await simpleBrands.json();
          } catch {}
          try {
            const simpleThemes = await fetch(`/api/themes?teamId=${user.teamId}`, { signal });
            if (simpleThemes.ok) themes = await simpleThemes.json();
          } catch {}
          try {
            const simplePersonas = await fetch(`/api/personas?teamId=${user.teamId}`, { signal });
            if (simplePersonas.ok) personas = await simplePersonas.json();
          } catch {}
        }

        // Debug logs
        console.log('Dados da pesquisa:', { 
          searchQuery, 
          brands: brands?.length || 0, 
          themes: themes?.length || 0, 
          personas: personas?.length || 0,
          teamId: user.teamId 
        });

        const results: SearchResult[] = [
          ...(Array.isArray(brands) ? brands : []).map((brand: any) => ({
            id: brand.id || brand._id || '',
            name: brand.name || '',
            type: 'brand' as const,
            description: brand.description || ''
          })),
          ...(Array.isArray(themes) ? themes : []).map((theme: any) => ({
            id: theme.id || theme._id || '',
            name: theme.title || theme.name || '',
            type: 'theme' as const,
            description: theme.description || ''
          })),
          ...(Array.isArray(personas) ? personas : []).map((persona: any) => ({
            id: persona.id || persona._id || '',
            name: persona.name || '',
            type: 'persona' as const,
            description: persona.description || ''
          }))
        ].filter(result => {
          // Filtrar apenas resultados que realmente correspondem ao termo pesquisado
          if (!result.name && !result.description) return false;
          
          const searchTerm = searchQuery.toLowerCase().trim();
          const nameMatch = result.name ? result.name.toLowerCase().includes(searchTerm) : false;
          const descriptionMatch = result.description ? result.description.toLowerCase().includes(searchTerm) : false;
          
          return nameMatch || descriptionMatch;
        }).sort((a, b) => {
          // Ordenar por relevância: primeiro os que começam com o termo, depois os que contêm
          const searchTerm = searchQuery.toLowerCase().trim();
          const aNameMatch = (a.name || '').toLowerCase();
          const bNameMatch = (b.name || '').toLowerCase();
          
          // Prioridade 1: Correspondência exata
          if (aNameMatch === searchTerm && bNameMatch !== searchTerm) return -1;
          if (bNameMatch === searchTerm && aNameMatch !== searchTerm) return 1;
          
          // Prioridade 2: Começa com o termo
          const aStartsWith = aNameMatch.startsWith(searchTerm);
          const bStartsWith = bNameMatch.startsWith(searchTerm);
          if (aStartsWith && !bStartsWith) return -1;
          if (bStartsWith && !aStartsWith) return 1;
          
          // Prioridade 3: Contém no nome vs descrição
          const aNameContains = aNameMatch.includes(searchTerm);
          const bNameContains = bNameMatch.includes(searchTerm);
          if (aNameContains && !bNameContains) return -1;
          if (bNameContains && !aNameContains) return 1;
          
          // Ordem alfabética como último critério
          return (a.name || '').localeCompare(b.name || '');
        });

        // Salvar no cache
        console.log('Resultados filtrados:', results.length, results);
        setSearchCache(prev => new Map(prev.set(cacheKey, results)));
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        if (!signal.aborted) {
          console.error('Erro na pesquisa:', error);
        }
      } finally {
        if (!signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 150); // Debounce reduzido para 150ms

    return () => {
      clearTimeout(searchTimeout);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery, user?.teamId, searchCache]);

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    // Verificações de segurança
    if (!text || typeof text !== 'string' || !searchTerm || !searchTerm.trim()) {
      return text || '';
    }
    
    try {
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      
      return parts.map((part, index) => 
        regex.test(part) ? (
          <span key={index} className="bg-primary/20 text-primary font-medium rounded px-1">
            {part}
          </span>
        ) : part
      );
    } catch (error) {
      // Em caso de erro, retornar o texto original
      console.warn('Erro ao destacar termo de pesquisa:', error);
      return text;
    }
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'brand':
        return <Tag className="h-4 w-4 text-blue-500" />;
      case 'theme':
        return <Palette className="h-4 w-4 text-purple-500" />;
      case 'persona':
        return <Users className="h-4 w-4 text-green-500" />;
    }
  };

  const getTypeName = (type: SearchResult['type']) => {
    switch (type) {
      case 'brand':
        return 'Marca';
      case 'theme':
        return 'Tema';
      case 'persona':
        return 'Persona';
    }
  };

  const getTypeLink = (type: SearchResult['type']) => {
    switch (type) {
      case 'brand':
        return '/marcas';
      case 'theme':
        return '/temas';
      case 'persona':
        return '/personas';
    }
  };

  return (
    <header className="flex h-20 items-center justify-between shadow-sm shadow-primary/10 bg-card px-4 md:px-8 flex-shrink-0">
      <div className="relative flex-1 max-w-2xl" ref={searchRef}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />
        )}
        <Input
          placeholder="Pesquisar marcas, temas, personas..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // Mostrar feedback visual imediato
            if (e.target.value.trim().length >= 2) {
              setIsSearching(true);
            }
          }}
          onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
          className={`w-full rounded-2xl pl-12 pr-12 py-3 text-base border-2 bg-background/50 transition-all duration-200 ${
            isSearching 
              ? 'border-primary/50 shadow-md' 
              : 'border-border/50 hover:border-primary/30 focus:border-primary/50'
          }`}
        />
        
        {/* Resultados da pesquisa */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border/50 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            {isSearching && searchResults.length === 0 ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 text-primary animate-spin mr-3" />
                <span className="text-muted-foreground">Pesquisando...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                {searchResults.slice(0, 8).map((result) => ( // Limitar a 8 resultados para melhor performance
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={getTypeLink(result.type)}
                    onClick={() => setShowResults(false)}
                    className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors duration-150 border-b border-border/30 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    <div className="flex-shrink-0">
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          {result.name ? highlightSearchTerm(result.name, searchQuery.trim()) : ''}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          {getTypeName(result.type)}
                        </span>
                      </div>
                      {result.description && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {highlightSearchTerm(result.description, searchQuery.trim())}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
                {searchResults.length > 8 && (
                  <div className="p-3 text-center border-t border-border/30">
                    <span className="text-sm text-muted-foreground">
                      +{searchResults.length - 8} mais resultados
                    </span>
                  </div>
                )}
              </>
            ) : searchQuery.trim().length >= 2 && !isSearching ? (
              <div className="p-6 text-center">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Nenhum resultado encontrado</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Tente pesquisar por marcas, temas ou personas
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 md:gap-4 ml-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-2xl h-12 w-12 hover:bg-primary/20 transition-all duration-200 border border-transparent hover:border-primary/40 hover:shadow-md"
        >
          <Bell className="h-5 w-5 text-muted-foreground transition-colors duration-200" />
          <span className="sr-only">Notificações</span>
        </Button>

        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-2xl h-12 w-12 hover:bg-primary/20 transition-all duration-200 border border-transparent hover:border-primary/40 hover:shadow-md"
              >
                <Settings className="h-5 w-5 text-muted-foreground transition-colors duration-200" />
                <span className="sr-only">Configurações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-border/20 shadow-xl">
              <DropdownMenuItem className="p-3">
                <Info className="mr-3 h-4 w-4" />
                <span>Sobre o Creator</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3">
                <FileText className="mr-3 h-4 w-4" />
                <span>Termos de Serviço</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3">
                <Shield className="mr-3 h-4 w-4" />
                <span>Política de Privacidade</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DialogTrigger asChild>
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 p-3">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sair da Conta</span>
                </DropdownMenuItem>
              </DialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>

          <DialogContent className="border-border/20 shadow-2xl">
            <DialogHeader className="items-center text-center">
              <Image
                src="/assets/logoCreatorPreta.png"
                alt="Logo Creator"
                width={130}
                height={35}
                className="mb-6"
              />
              <DialogTitle className="text-2xl font-bold">Você tem certeza que deseja sair?</DialogTitle>
              <DialogDescription className="text-base mt-2">
                Você precisará fazer login novamente para acessar sua conta e continuar criando conteúdo.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-3 mt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="w-full rounded-2xl hover:border-accent border-2 h-12">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="button" variant="destructive" className="w-full rounded-2xl h-12" onClick={logout}>
                Sair da Conta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Link
          href="/perfil"
          className="flex h-12 w-12 items-center justify-center rounded-2xl 
            bg-gradient-to-br from-primary via-purple-600 to-secondary text-white font-bold text-lg
            transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25
            border-2 border-transparent hover:border-white/20"
        >
          <User className="h-6 w-6" />
          <span className="sr-only">Perfil</span>
        </Link>
      </div>
    </header>
  );
}