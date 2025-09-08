'use client';

import { useState, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface ColorItem {
    id: string;
    hex: string;
    name?: string;
}

interface StrategicThemeColorPickerProps {
    colors: string; // Recebe a string de cores
    onColorsChange: (colors: string) => void; // Retorna a string de cores
    maxColors?: number;
}

// Função para gerar ID único
const generateId = (): string => {
    return `color-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Função para converter string de cores para array
const parseColorsString = (colorsString: string): ColorItem[] => {
    try {
        if (!colorsString) return [];
        return JSON.parse(colorsString);
    } catch (e) {
        console.error('Erro ao converter string de cores:', e);
        return [];
    }
};

// Função para converter array de cores para string
const stringifyColors = (colors: ColorItem[]): string => {
    try {
        return JSON.stringify(colors);
    } catch (e) {
        console.error('Erro ao converter array de cores:', e);
        return '[]';
    }
};

export function StrategicThemeColorPicker({ colors, onColorsChange, maxColors = 8 }: StrategicThemeColorPickerProps) {
    const [currentColor, setCurrentColor] = useState('#ffffff');
    const [colorName, setColorName] = useState('');
    const [colorsList, setColorsList] = useState<ColorItem[]>(() => parseColorsString(colors));

    const addColor = () => {
        // Verificar se atingiu o limite
        if (colorsList.length >= maxColors) {
            toast.error(`Limite máximo de ${maxColors} cores atingido`);
            return;
        }

        // Verificar se a cor já foi adicionada
        if (colorsList.some(c => c.hex.toLowerCase() === currentColor.toLowerCase())) {
            toast.warning('Esta cor já foi adicionada à paleta');
            return;
        }

        const newColor: ColorItem = {
            id: generateId(),
            hex: currentColor,
            name: colorName.trim() || undefined,
        };

        const newColorsList = [...colorsList, newColor];
        setColorsList(newColorsList);
        onColorsChange(stringifyColors(newColorsList));
        setColorName('');
        toast.success(`Cor ${colorName.trim() || currentColor} adicionada à paleta`);
    };

    const removeColor = (id: string) => {
        const newColorsList = colorsList.filter(color => color.id !== id);
        setColorsList(newColorsList);
        onColorsChange(stringifyColors(newColorsList));
    };

    return (
        <div className="space-y-4">
            <Label className="text-sm font-medium">Paleta de Cores</Label>
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Seletor Visual - 4 colunas */}
                        <div className="lg:col-span-4 space-y-3">
                            <div className="w-full">
                                <HexColorPicker color={currentColor} onChange={setCurrentColor} />
                            </div>
                        </div>

                        {/* Preview e Controles - 4 colunas */}
                        <div className="lg:col-span-4 space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="color-name" className="text-sm">Nome da Cor (opcional)</Label>
                                <Input
                                    id="color-name"
                                    value={colorName}
                                    onChange={(e) => setColorName(e.target.value)}
                                    placeholder="Ex: Azul principal"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                                <div
                                    className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm flex-shrink-0"
                                    style={{ backgroundColor: currentColor }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{colorName || currentColor}</p>
                                    <p className="text-sm text-muted-foreground truncate">{currentColor.toUpperCase()}</p>
                                </div>
                            </div>

                            <Button
                                onClick={addColor}
                                className="w-full"
                                size="sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Cor
                            </Button>
                        </div>

                        {/* Lista de Cores - 4 colunas */}
                        <div className="lg:col-span-4 space-y-3 mt-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">
                                    Cores Selecionadas
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    {colorsList.length}/{maxColors}
                                </span>
                            </div>
                            
                            {colorsList.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {colorsList.map((color) => (
                                        <div
                                            key={color.id}
                                            className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/50 group"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-md border shadow-sm"
                                                style={{ backgroundColor: color.hex }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">
                                                    {color.name || color.hex}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {color.hex.toUpperCase()}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100"
                                                onClick={() => removeColor(color.id)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/10">
                                    <Palette className="w-8 h-8 text-muted-foreground/50 mb-2" />
                                    <p className="text-sm text-muted-foreground text-center">
                                        Nenhuma cor adicionada
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
