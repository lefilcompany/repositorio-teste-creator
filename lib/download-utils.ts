// lib/download-utils.ts

/**
 * Utilitário para download de imagens
 * Fornece funções reutilizáveis para download de imagens em diferentes formatos
 */

export interface DownloadOptions {
  filename?: string;
  useProxy?: boolean;
  timeout?: number;
}

/**
 * Faz o download de uma imagem a partir de uma URL
 * @param imageUrl - URL da imagem (pode ser externa, interna ou base64)
 * @param options - Opções de download
 * @returns Promise que resolve quando o download é concluído
 */
export async function downloadImage(imageUrl: string, options: DownloadOptions = {}): Promise<void> {
  const {
    filename,
    useProxy = true,
    timeout = 30000
  } = options;

  if (!imageUrl) {
    throw new Error('URL da imagem não fornecida');
  }

  let response: Response;
  let blob: Blob;
  let finalFilename = filename || 'image';

  // Controle de timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Se useProxy for true ou for URL interna, usar a API de proxy
    if (useProxy || imageUrl.startsWith('/')) {
      const proxyUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}`;
      
      response = await fetch(proxyUrl, {
        method: 'GET',
        headers: { 'Accept': 'image/*' },
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      blob = await response.blob();

      // Extrair filename do header se não foi fornecido
      if (!filename) {
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            finalFilename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
      }
    } else {
      // Download direto para URLs externas
      response = await fetch(imageUrl, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'image/*' },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      blob = await response.blob();
    }

    // Verificar se o blob não está vazio
    if (!blob || blob.size === 0) {
      throw new Error('A imagem está vazia ou corrompida');
    }

    // Determinar extensão se não foi fornecida no filename
    if (!finalFilename.includes('.')) {
      const contentType = response.headers.get('Content-Type') || blob.type || 'image/png';
      const extension = contentType.includes('jpeg') || contentType.includes('jpg') 
        ? 'jpg' 
        : contentType.includes('webp') 
        ? 'webp'
        : contentType.includes('gif')
        ? 'gif'
        : 'png';
      finalFilename = `${finalFilename}.${extension}`;
    }

    // Executar o download
    await executeDownload(blob, finalFilename);

  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Executa o download do blob criando um link temporário
 * @param blob - Blob da imagem
 * @param filename - Nome do arquivo
 */
async function executeDownload(blob: Blob, filename: string): Promise<void> {
  const url = window.URL.createObjectURL(blob);
  
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    window.URL.revokeObjectURL(url);
  }
}

/**
 * Converte uma imagem base64 para blob
 * @param base64Data - String base64 da imagem (com ou sem data URL prefix)
 * @param mimeType - Tipo MIME da imagem (padrão: image/png)
 * @returns Blob da imagem
 */
export function base64ToBlob(base64Data: string, mimeType: string = 'image/png'): Blob {
  // Remove o prefixo data URL se presente
  const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Extrai informações de uma URL de imagem
 * @param imageUrl - URL da imagem
 * @returns Informações sobre a URL
 */
export function getImageUrlInfo(imageUrl: string) {
  const info = {
    isBase64: false,
    isInternal: false,
    isExternal: false,
    mimeType: null as string | null,
    actionId: null as string | null
  };

  if (imageUrl.startsWith('data:image')) {
    info.isBase64 = true;
    const mimeMatch = imageUrl.match(/^data:(image\/[^;]+);/);
    info.mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  } else if (imageUrl.startsWith('/')) {
    info.isInternal = true;
    if (imageUrl.startsWith('/api/image/')) {
      info.actionId = imageUrl.split('/').pop() || null;
    }
  } else {
    info.isExternal = true;
  }

  return info;
}
