'use client';

interface ColorDisplayProps {
  colorString: string;
}

interface ColorItem {
  id: string;
  hex: string;
  name?: string;
}

export function ColorDisplay({ colorString }: ColorDisplayProps) {
  const parseColors = (colorStr: string): ColorItem[] => {
    try {
      return JSON.parse(colorStr);
    } catch (e) {
      console.error('Erro ao fazer parse das cores:', e);
      return [];
    }
  };

  const colors = parseColors(colorString);

  if (colors.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Nenhuma cor definida
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm text-muted-foreground">Paleta de Cores</p>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {colors.length} {colors.length === 1 ? 'cor' : 'cores'}
        </span>
      </div>
      
      {colors.length <= 4 ? (
        // Layout horizontal para poucas cores
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {colors.map((color) => (
            <div key={color.id} className="flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 rounded-xl border-2 border-gray-300 shadow-md hover:shadow-lg transition-shadow"
                style={{ backgroundColor: color.hex }}
                title={`${color.name || 'Cor'} - ${color.hex}`}
              />
              <div className="text-center">
                <div className="text-xs font-medium text-foreground truncate max-w-[80px]">
                  {color.name || 'Sem nome'}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {color.hex.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Layout em grid para muitas cores
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {colors.map((color) => (
            <div
              key={color.id}
              className="flex items-center gap-3 p-3 bg-background/60 rounded-lg border border-border/40 hover:bg-background/80 transition-colors"
              title={`${color.name || 'Cor'} - ${color.hex}`}
            >
              <div
                className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm flex-shrink-0"
                style={{ backgroundColor: color.hex }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate mb-1">
                  {color.name || 'Sem nome'}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {color.hex.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
