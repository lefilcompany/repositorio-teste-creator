'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Palette, Plus } from 'lucide-react';
import ThemeList from '@/components/temas/themeList';       // CORRECTED: PascalCase path
import ThemeDetails from '@/components/temas/themeDetails'; // CORRECTED: PascalCase path
import ThemeDialog from '@/components/temas/themeDialog';     // CORRECTED: PascalCase path
import type { StrategicTheme } from '@/types/theme';

export default function TemasPage() {
  const [themes, setThemes] = useState<StrategicTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<StrategicTheme | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [themeToEdit, setThemeToEdit] = useState<StrategicTheme | null>(null);

  // Load themes from localStorage on initial render
  useEffect(() => {
    try {
      const storedThemes = localStorage.getItem('creator-themes');
      if (storedThemes) {
        setThemes(JSON.parse(storedThemes));
      }
    } catch (error) {
      console.error("Failed to load themes from localStorage", error);
    }
  }, []);

  // Save themes to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('creator-themes', JSON.stringify(themes));
    } catch (error) { // CORRECTED: Added missing opening brace {
      console.error("Failed to save themes to localStorage", error);
    }
  }, [themes]);

  const handleOpenDialog = useCallback((theme: StrategicTheme | null = null) => {
    setThemeToEdit(theme);
    setIsDialogOpen(true);
  }, []);

  const handleSaveTheme = useCallback((formData: { name: string; responsible: string }) => {
    const now = new Date().toISOString();

    if (themeToEdit) {
      const updatedThemes = themes.map(t =>
        t.id === themeToEdit.id ? { ...t, ...formData, updatedAt: now } : t
      );
      setThemes(updatedThemes);
      if (selectedTheme?.id === themeToEdit.id) {
        setSelectedTheme(prev => prev ? { ...prev, ...formData, updatedAt: now } : null);
      }
    } else {
      const newTheme: StrategicTheme = {
        id: now,
        name: formData.name,
        responsible: formData.responsible,
        createdAt: now,
        updatedAt: now,
      };
      setThemes(prevThemes => [...prevThemes, newTheme]);
    }
  }, [themeToEdit, themes, selectedTheme?.id]);

  const handleDeleteTheme = useCallback(() => {
    if (!selectedTheme) return;
    setThemes(themes.filter(t => t.id !== selectedTheme.id));
    setSelectedTheme(null);
  }, [selectedTheme, themes]);

  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center flex-shrink-0">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
            <Palette className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Seus Temas Estratégicos
            </h1>
            <p className="text-muted-foreground">
              Gerencie, edite ou crie novos temas para seus projetos.
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="mt-4 md:mt-0 rounded-lg bg-gradient-to-r from-primary to-secondary px-6 py-5 text-base">
          <Plus className="mr-2 h-5 w-5" />
          Novo tema
        </Button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow overflow-hidden">
        <ThemeList
          themes={themes}
          selectedTheme={selectedTheme}
          onSelectTheme={setSelectedTheme}
        />
        <ThemeDetails
          theme={selectedTheme}
          onEdit={handleOpenDialog}
          onDelete={handleDeleteTheme}
        />
      </main>

      <ThemeDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveTheme}
        themeToEdit={themeToEdit}
      />
    </div>
  );
}