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

    // Validar se é uma URL válida
    let url: URL;
    try {
      url = new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: 'URL da imagem inválida' }, 
        { status: 400 }
      );
    }

    // Verificar se é uma URL do OpenAI (para segurança)
    if (!url.hostname.includes('openai') && !url.hostname.includes('oaidalleapiprodscus')) {
      return NextResponse.json(
        { error: 'URL não autorizada' }, 
        { status: 403 }
      );
    }

    console.log('Fazendo fetch da imagem:', imageUrl);

    // Fazer o fetch da imagem com headers apropriados
    const imageResponse = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CreatorAI/1.0)',
        'Accept': 'image/*',
        'Cache-Control': 'no-cache'
      }
    });

    if (!imageResponse.ok) {
      console.error('Erro no fetch da imagem:', imageResponse.status, imageResponse.statusText);
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

    console.log('Imagem obtida com sucesso, tamanho:', imageBlob.size, 'bytes');

    // Determinar o tipo de conteúdo
    const contentType = imageBlob.type || 'image/png';
    
    // Criar headers para o download
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', imageBlob.size.toString());
    headers.set('Cache-Control', 'public, max-age=86400'); // Cache por 1 dia
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    // Converter blob para arrayBuffer e depois para Response
    const arrayBuffer = await imageBlob.arrayBuffer();
    
    return new NextResponse(arrayBuffer, {
      status: 200,
      statusText: 'OK',
      headers
    });

  } catch (error) {
    console.error('Erro no proxy de download:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json(
      { error: `Erro interno do servidor: ${errorMessage}` }, 
      { status: 500 }
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