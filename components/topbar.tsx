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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, Settings, User, LogOut, Info, FileText, Shield, Loader2, Users, Palette, Tag, Menu } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Notifications from '@/components/notifications';
import { cn } from '@/lib/utils'; // **ALTERAÇÃO:** Importei o cn para usar nas classes condicionais.

interface SearchResult {
  id: string;
  name: string;
  type: 'brand' | 'theme' | 'persona';
  description?: string;
}
interface TopBarProps {
  toggleMobileMenu: () => void;
}

export default function TopBar({ toggleMobileMenu }: TopBarProps) {
  const { logout, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchCache, setSearchCache] = useState<Map<string, SearchResult[]>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // ... (toda a lógica de busca permanece a mesma) ...
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchDialogOpen(true);
      }
      if (event.key === 'Escape' && isSearchDialogOpen) {
        setIsSearchDialogOpen(false);
        setSearchQuery('');
        setShowResults(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchDialogOpen]);

  useEffect(() => {
    if (isSearchDialogOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    } else if (!isSearchDialogOpen) {
      setSearchQuery('');
      setShowResults(false);
      setSearchResults([]);
    }
  }, [isSearchDialogOpen]);

  useEffect(() => {
    const clearCacheInterval = setInterval(() => {
      setSearchCache(new Map());
    }, 3 * 60 * 1000);

    return () => clearInterval(clearCacheInterval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    if (isSearchDialogOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchDialogOpen]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    const cacheKey = searchQuery.toLowerCase().trim();
    if (searchCache.has(cacheKey)) {
      setSearchResults(searchCache.get(cacheKey) || []);
      setShowResults(true);
      setIsSearching(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      if (!user?.teamId) return;

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsSearching(true);

      try {
        const searchPromises = [
          fetch(`/api/brands?teamId=${user.teamId}&search=${encodeURIComponent(searchQuery)}`, { signal }),
          fetch(`/api/themes?teamId=${user.teamId}&search=${encodeURIComponent(searchQuery)}`, { signal }),
          fetch(`/api/personas?teamId=${user.teamId}&search=${encodeURIComponent(searchQuery)}`, { signal })
        ];

        const [brandsResponse, themesResponse, personasResponse] = await Promise.allSettled(searchPromises);

        if (signal.aborted) return;

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
          try {
            const simpleBrands = await fetch(`/api/brands?teamId=${user.teamId}`, { signal });
            if (simpleBrands.ok) brands = await simpleBrands.json();
          } catch { }
          try {
            const simpleThemes = await fetch(`/api/themes?teamId=${user.teamId}`, { signal });
            if (simpleThemes.ok) themes = await simpleThemes.json();
          } catch { }
          try {
            const simplePersonas = await fetch(`/api/personas?teamId=${user.teamId}`, { signal });
            if (simplePersonas.ok) personas = await simplePersonas.json();
          } catch { }
        }

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
          if (!result.name && !result.description) return false;

          const searchTerm = searchQuery.toLowerCase().trim();
          const nameMatch = result.name ? result.name.toLowerCase().includes(searchTerm) : false;
          const descriptionMatch = result.description ? result.description.toLowerCase().includes(searchTerm) : false;

          return nameMatch || descriptionMatch;
        }).sort((a, b) => {
          const searchTerm = searchQuery.toLowerCase().trim();
          const aNameMatch = (a.name || '').toLowerCase();
          const bNameMatch = (b.name || '').toLowerCase();

          if (aNameMatch === searchTerm && bNameMatch !== searchTerm) return -1;
          if (bNameMatch === searchTerm && aNameMatch !== searchTerm) return 1;

          const aStartsWith = aNameMatch.startsWith(searchTerm);
          const bStartsWith = bNameMatch.startsWith(searchTerm);
          if (aStartsWith && !bStartsWith) return -1;
          if (bStartsWith && !aStartsWith) return 1;

          const aNameContains = aNameMatch.includes(searchTerm);
          const bNameContains = bNameMatch.includes(searchTerm);
          if (aNameContains && !bNameContains) return -1;
          if (bNameContains && !aNameContains) return 1;

          return (a.name || '').localeCompare(b.name || '');
        }).slice(0, 10);

        setSearchCache(prev => new Map(prev.set(cacheKey, results)));
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        if (!signal.aborted) {
        }
      } finally {
        if (!signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 100);

    return () => {
      clearTimeout(searchTimeout);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery, user?.teamId, searchCache]);

  const highlightSearchTerm = (text: string, searchTerm: string) => {
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
    // **ALTERAÇÃO 1:** Ajustado o z-index de z-30 para z-20 para que fique abaixo do overlay da sidebar.
    <header className="sticky top-0 z-20 flex h-16 md:h-20 items-center justify-between shadow-sm shadow-primary/10 bg-card/95 backdrop-blur-md border-b border-border/20 px-3 md:px-6 lg:px-8 flex-shrink-0 transition-all duration-300">
      {/* **ALTERAÇÃO 2:** Adicionado flex-1 para o container da esquerda para melhor espaçamento. */}
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        {/* Botão Hambúrguer para Mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobileMenu}
          className="lg:hidden h-12 w-12 rounded-2xl hover:bg-primary/20 transition-all duration-200 border border-transparent bg-background hover:border-primary/40 hover:shadow-md"
        >
          <Menu className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground transition-colors duration-200" />
          <span className="sr-only">Abrir menu</span>
        </Button>

        {/* **ALTERAÇÃO 3:** Logo agora fica oculto em telas menores que 420px para não espremer. */}
        <div className="hidden min-[420px]:block lg:hidden">
          <Link href="/" className="block">
            <Image
              src="/assets/logoCreatorPreta.png"
              alt="Logo Creator"
              width={100}
              height={25}
              priority
              className="h-6 w-auto"
            />
          </Link>
        </div>
      </div>

      {/* Search section - Full input on desktop, icon on mobile */}
      <div className="hidden md:block flex-1 max-w-2xl mx-6" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />
          )}
          <Input
            placeholder="Pesquisar marcas, temas, personas..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim().length >= 2) {
                setIsSearching(true);
              }
            }}
            onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
            className={`w-full rounded-2xl pl-12 pr-12 py-3 text-base border-2 bg-background/50 transition-all duration-200 ${isSearching
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
                  {searchResults.slice(0, 8).map((result) => (
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
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-1 md:gap-3">
        {/* Search button for mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSearchDialogOpen(true)}
          className="md:hidden h-12 w-12 rounded-2xl hover:bg-primary/20 transition-all duration-200 border border-transparent bg-background hover:border-primary/40 hover:shadow-md"
        >
          <Search className="h-5 w-5 text-muted-foreground transition-colors duration-200" />
          <span className="sr-only">Pesquisar</span>
        </Button>

        <Notifications />

        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id="topbar-settings"
                variant="ghost"
                size="sm"
                className="h-12 w-12 rounded-2xl hover:bg-primary/20 transition-all duration-200 border border-transparent bg-background hover:border-primary/40 hover:shadow-md"
              >
                <Settings className="h-5 w-5 text-muted-foreground transition-colors duration-200" />
                <span className="sr-only">Configurações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-border/20 shadow-xl">
              <DropdownMenuItem asChild className="p-3">
                <Link href="/sobre-creator" className="flex items-center">
                  <Info className="mr-3 h-4 w-4" />
                  <span>Sobre o Creator</span>
                </Link>
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

        {/* Profile Button */}
        <Link
          id="topbar-profile"
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

      {/* Search Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] p-0 gap-0 border-border/20 shadow-2xl overflow-hidden">
          <DialogHeader className="p-4 pb-3 border-b border-border/20 flex-shrink-0">
            <DialogTitle className="text-left text-lg font-semibold flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Pesquisar Conteúdo
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-full min-h-0">
            <div className="p-4 flex-shrink-0" ref={searchRef}>
              {/* Search Input */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-all duration-200 z-10 text-primary"
                />

                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin z-10" />
                )}

                <Input
                  ref={searchInputRef}
                  placeholder="Digite para pesquisar marcas, temas, personas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowResults(searchResults.length > 0)}
                  className="pl-10 pr-4 h-12 text-base bg-muted/50 border-border/50 rounded-xl focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/70"
                />

                {/* Keyboard shortcut hint */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {!isSearching && !searchQuery && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                      <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border/50 rounded">⌘K</kbd>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {isSearching && searchResults.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 text-primary animate-spin mr-3" />
                  <span className="text-muted-foreground">Pesquisando...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}`}
                      href={getTypeLink(result.type)}
                      onClick={() => {
                        setIsSearchDialogOpen(false);
                        setSearchQuery('');
                        setShowResults(false);
                      }}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors duration-150 rounded-xl border border-transparent hover:border-border/50 group"
                    >
                      <div className="flex-shrink-0 p-2 rounded-lg bg-muted/50 group-hover:bg-muted/70 transition-colors duration-150">
                        {getTypeIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-foreground truncate text-base">
                            {result.name ? highlightSearchTerm(result.name, searchQuery.trim()) : ''}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium flex-shrink-0">
                            {getTypeName(result.type)}
                          </span>
                        </div>
                        {result.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {highlightSearchTerm(result.description, searchQuery.trim())}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                  {searchResults.length === 10 && (
                    <div className="p-3 text-center border-t border-border/20 bg-muted/20 rounded-lg mt-4">
                      <span className="text-xs text-muted-foreground">
                        Mostrando os 10 primeiros resultados. Refine sua pesquisa para ver resultados mais específicos.
                      </span>
                    </div>
                  )}
                </div>
              ) : searchQuery.trim().length >= 2 && !isSearching ? (
                <div className="p-8 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">Nenhum resultado encontrado</p>
                  <p className="text-sm text-muted-foreground/70">
                    Tente pesquisar por diferentes palavras-chave ou verifique a ortografia
                  </p>
                </div>
              ) : searchQuery.trim().length === 0 ? (
                <div className="p-8 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">Comece a pesquisar</p>
                  <p className="text-sm text-muted-foreground/70">
                    Digite pelo menos 2 caracteres para ver os resultados
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      Marcas
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                      <Palette className="h-3 w-3" />
                      Temas
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Personas
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}