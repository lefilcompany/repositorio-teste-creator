// components/ui/download-button.tsx
'use client';

import { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Download, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { downloadImage, DownloadOptions } from '@/lib/download-utils';

interface DownloadButtonProps extends Omit<ButtonProps, 'onClick'> {
  imageUrl: string;
  filename?: string;
  downloadOptions?: Partial<DownloadOptions>;
  onDownloadStart?: () => void;
  onDownloadSuccess?: () => void;
  onDownloadError?: (error: Error) => void;
  showToast?: boolean;
}

export function DownloadButton({
  imageUrl,
  filename,
  downloadOptions,
  onDownloadStart,
  onDownloadSuccess,
  onDownloadError,
  showToast = true,
  children,
  disabled,
  ...props
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!imageUrl || isDownloading) return;

    setIsDownloading(true);
    onDownloadStart?.();

    if (showToast) {
      toast.info('Iniciando download...');
    }

    try {
      await downloadImage(imageUrl, {
        filename,
        ...downloadOptions,
      });

      if (showToast) {
        toast.success('Download concluído!');
      }
      
      onDownloadSuccess?.();

    } catch (error) {
      console.error('Erro no download:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro ao baixar a imagem';

      if (showToast) {
        toast.error(`Falha no download: ${errorMessage}`);
      }

      onDownloadError?.(error instanceof Error ? error : new Error(errorMessage));

    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || isDownloading || !imageUrl}
      {...props}
    >
      {isDownloading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {children && <span className="ml-2">{children}</span>}
    </Button>
  );
}
