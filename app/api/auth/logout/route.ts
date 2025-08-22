// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Como o JWT é stateless e está no localStorage do cliente,
    // o logout é principalmente do lado do cliente
    // Podemos adicionar log de auditoria aqui se necessário
    
    return NextResponse.json({ 
      message: 'Logout realizado com sucesso',
      success: true 
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
