'use client';

import { useState, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
    const [hexInput, setHexInput] = useState('#ffffff');

    const handleColorChange = useCallback((hex: string) => {
        setCurrentColor(hex);
        setHexInput(hex);
    }, []);

    const handleManualHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setHexInput(value);

        if (/^#([0-9A-Fa-f]{3}){1,2}$/i.test(value)) {
            handleColorChange(value);
        }
    };

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
                                <HexColorPicker color={currentColor} onChange={handleColorChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hex-input" className="text-sm">Valor HEX</Label>
                                <Input
                                    id="hex-input"
                                    value={hexInput}
                                    onChange={handleManualHexChange}
                                    placeholder="#ffffff"
                                    className="text-center font-mono"
                                />
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

                            <div className="space-y-2">
                                <Label className="text-sm">Preview</Label>
                                <div
                                    className="w-full h-16 rounded-md border"
                                    style={{ backgroundColor: currentColor }}
                                />
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
                        <div className="lg:col-span-4 space-y-3">
                            <Label className="text-sm">Cores na Paleta ({colorsList.length}/{maxColors})</Label>
                            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                                {colorsList.map(color => (
                                    <div key={color.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-8 w-8 rounded-md border"
                                                style={{ backgroundColor: color.hex }}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm">{color.name || color.hex}</span>
                                                {color.name && <span className="text-xs text-muted-foreground">{color.hex}</span>}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeColor(color.id)}
                                            className="h-8 w-8"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {colorsList.length === 0 && (
                                    <div className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-md h-full">
                                        <Palette className="h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">Nenhuma cor adicionada ainda.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
