import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { actionId: string } }) {
  try {
    const actionId = params.actionId;
    
    if (!actionId) {
      return NextResponse.json({ error: 'Action ID é obrigatório' }, { status: 400 });
    }

    // Busca a ação no banco
    const action = await prisma.action.findUnique({
      where: { id: actionId },
      select: { result: true }
    });

    if (!action || !action.result) {
      return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 });
    }

    const result = action.result as any;
    
    // Verifica se tem dados de imagem
    if (!result.base64Data) {
      return NextResponse.json({ error: 'Dados da imagem não disponíveis' }, { status: 404 });
    }

    // Converte base64 para buffer
    const buffer = Buffer.from(result.base64Data, 'base64');
    const mimeType = result.mimeType || 'image/png';

    // Retorna a imagem
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000', // Cache por 1 ano
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
