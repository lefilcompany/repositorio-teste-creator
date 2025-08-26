// app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, getPasswordResetEmailTemplate } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Sempre responder com sucesso para não revelar quais e-mails existem
      return NextResponse.json({ 
        message: 'Se um usuário com este e-mail existir, um link de recuperação será enviado.' 
      });
    }

    // Gerar token de reset seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    // Salvar token hasheado no banco de dados
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken, // Salvamos o hash do token por segurança
        resetTokenExpiry,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // Tentar enviar e-mail
    const emailTemplate = getPasswordResetEmailTemplate(user.name, resetUrl);
    const emailResult = await sendEmail({
      to: email,
      subject: 'Recuperação de Senha - Creator',
      html: emailTemplate,
    });

    // Log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('=== RECUPERAÇÃO DE SENHA (DEV) ===');
      console.log(`E-mail: ${email}`);
      console.log(`Token: ${resetToken}`);
      console.log(`Link: ${resetUrl}`);
      console.log(`E-mail enviado: ${emailResult.success ? 'Sim' : 'Não'}`);
      if (!emailResult.success) {
        console.log(`Erro do e-mail: ${emailResult.error}`);
      }
      console.log('================================');
    }

    return NextResponse.json({ 
      message: 'Se um usuário com este e-mail existir, um link de recuperação será enviado.',
      // Informações extras para desenvolvimento
      ...(process.env.NODE_ENV === 'development' && { 
        resetToken,
        resetUrl,
        emailSent: emailResult.success 
      })
    });

  } catch (error) {
    console.error('Erro ao processar recuperação de senha:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
