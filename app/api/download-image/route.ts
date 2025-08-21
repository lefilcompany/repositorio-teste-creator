// app/api/download-image/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL da imagem não fornecida' }, 
        { status: 400 }
      );
    }

    console.log('Download solicitado para URL:', imageUrl);

    // Caso seja uma URL interna (/api/image/[actionId])
    if (imageUrl.startsWith('/api/image/')) {
      const actionId = imageUrl.split('/').pop();
      if (!actionId) {
        return NextResponse.json(
          { error: 'ID da ação inválido' },
          { status: 400 }
        );
      }

      // Fazer proxy para nossa própria API de imagem
      const baseUrl = req.nextUrl.origin;
      const internalImageUrl = `${baseUrl}${imageUrl}`;
      
      console.log('Fazendo fetch da imagem interna:', internalImageUrl);
      
      const imageResponse = await fetch(internalImageUrl, {
        method: 'GET',
        headers: {
          'User-Agent': req.headers.get('user-agent') || 'CreatorAI-Download/1.0',
        }
      });

      if (!imageResponse.ok) {
        console.error('Erro ao buscar imagem interna:', imageResponse.status, imageResponse.statusText);
        return NextResponse.json(
          { error: `Falha ao buscar a imagem: ${imageResponse.status} ${imageResponse.statusText}` }, 
          { status: imageResponse.status }
        );
      }

      const imageBlob = await imageResponse.blob();
      const contentType = imageResponse.headers.get('Content-Type') || 'image/png';
      
      console.log('Imagem interna obtida com sucesso, tamanho:', imageBlob.size, 'bytes');

      // Criar headers para download com nome de arquivo apropriado
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Length', imageBlob.size.toString());
      headers.set('Content-Disposition', `attachment; filename="creator-ai-image-${actionId}.${contentType.includes('jpeg') ? 'jpg' : 'png'}"`);
      headers.set('Cache-Control', 'no-cache');

      const arrayBuffer = await imageBlob.arrayBuffer();
      return new NextResponse(arrayBuffer, { status: 200, headers });
    }

    // Caso a imagem venha como Data URL (base64)
    if (imageUrl.startsWith('data:image')) {
      const base64Data = imageUrl.split(',')[1];
      if (!base64Data) {
        return NextResponse.json(
          { error: 'Dados base64 inválidos' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(base64Data, 'base64');
      const mimeMatch = imageUrl.match(/^data:(image\/[^;]+);/);
      const contentType = mimeMatch ? mimeMatch[1] : 'image/png';
      const extension = contentType.includes('jpeg') ? 'jpg' : 'png';
      
      console.log('Processando imagem base64, tamanho:', buffer.length, 'bytes');

      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Length', buffer.length.toString());
      headers.set('Content-Disposition', `attachment; filename="creator-ai-image.${extension}"`);
      headers.set('Cache-Control', 'no-cache');

      return new NextResponse(buffer, { status: 200, headers });
    }

    // Validar se é uma URL externa válida
    let url: URL;
    try {
      url = new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: 'URL da imagem inválida' },
        { status: 400 }
      );
    }

    // Verificar se é uma URL autorizada (OpenAI, etc.)
    const authorizedHosts = [
      'openai.com',
      'oaidalleapiprodscus.blob.core.windows.net',
      'cdn.openai.com'
    ];

    const isAuthorized = authorizedHosts.some(host => 
      url.hostname.includes(host) || url.hostname.endsWith(host)
    );

    if (!isAuthorized) {
      console.error('URL não autorizada:', url.hostname);
      return NextResponse.json(
        { error: 'URL não autorizada para download' },
        { status: 403 }
      );
    }

    console.log('Fazendo fetch da imagem externa:', imageUrl);

    // Fazer o fetch da imagem externa com headers apropriados
    const imageResponse = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CreatorAI/1.0)',
        'Accept': 'image/*',
        'Referer': req.nextUrl.origin,
      },
      // Timeout de 30 segundos
      signal: AbortSignal.timeout(30000)
    });

    if (!imageResponse.ok) {
      console.error('Erro no fetch da imagem externa:', imageResponse.status, imageResponse.statusText);
      return NextResponse.json(
        { error: `Falha ao buscar a imagem: ${imageResponse.status} ${imageResponse.statusText}` }, 
        { status: imageResponse.status }
      );
    }

    // Obter o blob da imagem
    const imageBlob = await imageResponse.blob();
    
    if (!imageBlob || imageBlob.size === 0) {
      return NextResponse.json(
        { error: 'Imagem vazia ou corrompida' }, 
        { status: 500 }
      );
    }

    console.log('Imagem externa obtida com sucesso, tamanho:', imageBlob.size, 'bytes');

    // Determinar o tipo de conteúdo e extensão
    const contentType = imageBlob.type || imageResponse.headers.get('Content-Type') || 'image/png';
    const extension = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
    
    // Criar headers para o download
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', imageBlob.size.toString());
    headers.set('Content-Disposition', `attachment; filename="creator-ai-image.${extension}"`);
    headers.set('Cache-Control', 'no-cache');

    // Converter blob para arrayBuffer e retornar
    const arrayBuffer = await imageBlob.arrayBuffer();
    
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Erro no download da imagem:', error);
    
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        errorMessage = 'Timeout ao baixar a imagem';
        statusCode = 408;
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Erro de rede ao acessar a imagem';
        statusCode = 502;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: statusCode }
    );
  }
}

// Método OPTIONS para suporte a CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
