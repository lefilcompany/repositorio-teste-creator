import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // API simplificada - não faz nada, apenas retorna sucesso
  return NextResponse.json({ 
    message: 'Sistema simplificado - resume não necessário',
    simplified: true 
  });
}