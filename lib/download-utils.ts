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
    useProxy = false, // Mudamos o padrão para false
    timeout = 15000 // Reduzimos o timeout para 15 segundos
  } = options;

  if (!imageUrl) {
    throw new Error('URL da imagem não fornecida');
  }

  const imageInfo = getImageUrlInfo(imageUrl);
  let finalFilename = filename || `creator-ai-image-${Date.now()}`;

  try {
    // Tratamento para imagem base64
    if (imageInfo.isBase64) {
      const blob = base64ToBlob(imageUrl, imageInfo.mimeType || 'image/png');
      if (!finalFilename.includes('.')) {
        const extension = getExtensionFromMimeType(imageInfo.mimeType || 'image/png');
        finalFilename = `${finalFilename}.${extension}`;
      }
      await executeDownload(blob, finalFilename);
      return;
    }

    // Tratamento para URLs (internas ou externas)
    let blob: Blob;
    
    // Para URLs externas, tenta primeiro download direto, depois proxy como fallback
    if (imageInfo.isExternal) {
      try {
        blob = await downloadDirect(imageUrl, timeout);
      } catch (directError) {
        console.warn('Download direto falhou, tentando via proxy:', directError);
        try {
          blob = await downloadViaProxy(imageUrl, timeout);
        } catch (proxyError) {
          console.error('Ambos os métodos falharam:', { directError, proxyError });
          throw new Error(`Falha no download: ${directError instanceof Error ? directError.message : 'Erro direto'}`);
        }
      }
    } else {
      // Para URLs internas, usa proxy se solicitado, senão download direto
      if (useProxy) {
        blob = await downloadViaProxy(imageUrl, timeout);
      } else {
        blob = await downloadDirect(imageUrl, timeout);
      }
    }

    // Adiciona extensão se necessário
    if (!finalFilename.includes('.')) {
      const extension = getExtensionFromBlob(blob);
      finalFilename = `${finalFilename}.${extension}`;
    }

    await executeDownload(blob, finalFilename);

  } catch (error) {
    console.error('Erro no download:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no download';
    throw new Error(`Falha no download da imagem: ${errorMessage}`);
  }
}

/**
 * Download direto da URL
 */
async function downloadDirect(imageUrl: string, timeout: number): Promise<Blob> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(imageUrl, {
      method: 'GET',
      mode: 'cors',
      headers: { 
        'Accept': 'image/*,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    if (!blob || blob.size === 0) {
      throw new Error('A imagem está vazia ou corrompida');
    }

    return blob;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Download via proxy da API
 */
async function downloadViaProxy(imageUrl: string, timeout: number): Promise<Blob> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const proxyUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: { 'Accept': 'image/*' },
      signal: controller.signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    if (!blob || blob.size === 0) {
      throw new Error('A imagem está vazia ou corrompida');
    }

    return blob;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Obtém a extensão do arquivo a partir do tipo MIME
 */
function getExtensionFromMimeType(mimeType: string): string {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('gif')) return 'gif';
  if (mimeType.includes('svg')) return 'svg';
  return 'png';
}

/**
 * Obtém a extensão do arquivo a partir do blob
 */
function getExtensionFromBlob(blob: Blob): string {
  return getExtensionFromMimeType(blob.type || 'image/png');
}

/**
 * Executa o download do blob criando um link temporário
 * @param blob - Blob da imagem
 * @param filename - Nome do arquivo
 */
async function executeDownload(blob: Blob, filename: string): Promise<void> {
  try {
    // Método preferido: usando a API do navegador
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Imagens',
            accept: {
              'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
            }
          }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (error) {
        // Se o usuário cancelar ou não suportar, continua para o método tradicional
        console.log('Usando método tradicional de download');
      }
    }

    // Método tradicional: usando link temporário
    const url = window.URL.createObjectURL(blob);
    
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Adiciona o link ao DOM, clica e remove
      document.body.appendChild(link);
      link.click();
      
      // Remove o link após um breve delay para garantir que o download iniciou
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
    } finally {
      // Revoga o URL do objeto após um delay para garantir que o download foi processado
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    }
    
  } catch (error) {
    console.error('Erro ao executar download:', error);
    throw new Error('Falha ao iniciar o download');
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
