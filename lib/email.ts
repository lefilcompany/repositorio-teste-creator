// lib/email.ts
import { Resend } from 'resend';

// Inicializa o Resend com a chave de API
const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailProps {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailProps) {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY não configurado. E-mail não será enviado.');
            return { success: false, error: 'Configuração de e-mail não encontrada' };
        }

        const from = process.env.EMAIL_FROM || 'Creator <onboarding@resend.dev>';

        const result = await resend.emails.send({
            from,
            to,
            subject,
            html,
        });

        console.log('E-mail enviado com sucesso:', result);
        return { success: true, data: result };
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        return { success: false, error: 'Erro ao enviar e-mail' };
    }
}

// Template para e-mail de recuperação de senha
export function getPasswordResetEmailTemplate(userName: string, resetUrl: string) {
    return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperação de Senha - Creator</title>
    <style>
      body {
        background: linear-gradient(120deg, hsl(288,80%,98%) 0%, hsl(0,0%,100%) 100%);
        color: hsl(228,21%,17%);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        margin: 0;
        padding: 0;
        min-height: 100vh;
      }
      .container {
        max-width: 480px;
        margin: 40px auto;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(69, 36, 104, 0.10);
        overflow: hidden;
        border: 1.5px solid hsl(269,66%,48%,0.10);
      }
      .header {
        background: linear-gradient(90deg, hsl(330,100%,38%) 0%, hsl(269,66%,48%) 100%);
        color: #fff;
        padding: 32px 24px 18px 24px;
        text-align: center;
      }
      .logo {
        max-width: 140px;
        margin-bottom: 18px;
        filter: drop-shadow(0 2px 8px rgba(69,36,104,0.10));
      }
      .header h1 {
        margin: 0;
        font-size: 1.7rem;
        font-weight: 700;
        letter-spacing: -0.5px;
      }
      .content {
        padding: 36px 28px 28px 28px;
      }
      .content h2 {
        color: hsl(228,21%,17%);
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 18px;
      }
      .content p {
        color: hsl(0,0%,48%);
        font-size: 1rem;
        margin-bottom: 18px;
        line-height: 1.7;
      }
      .button-container {
        text-align: center;
        margin: 32px 0 24px 0;
      }
      .reset-button {
        display: inline-block;
        background: linear-gradient(90deg, hsl(330,100%,38%) 0%, hsl(269,66%,48%) 100%);
        color: #fff !important;
        text-decoration: none;
        padding: 15px 38px;
        border-radius: 999px;
        font-weight: 700;
        font-size: 1.08rem;
        letter-spacing: 0.01em;
        box-shadow: 0 2px 12px rgba(69,36,104,0.10);
        transition: background 0.2s, box-shadow 0.2s;
      }
      .reset-button:hover {
        background: linear-gradient(90deg, hsl(269,66%,48%) 0%, hsl(330,100%,38%) 100%);
        box-shadow: 0 4px 20px rgba(69,36,104,0.18);
      }
      .warning {
        background: #fff3cd;
        border-left: 4px solid #ffeaa7;
        padding: 13px 18px;
        margin: 22px 0 18px 0;
        color: #856404;
        border-radius: 8px;
        font-size: 0.98rem;
      }
      .url-fallback {
        margin-top: 18px;
        padding: 13px 14px;
        background: hsl(0,0%,90%);
        border-radius: 7px;
        font-size: 0.93rem;
        word-break: break-all;
        color: #666;
      }
      .footer {
        background: hsl(0,0%,90%);
        padding: 22px 18px;
        text-align: center;
      }
      .footer p {
        margin: 0;
        color: hsl(0,0%,48%);
        font-size: 0.97rem;
      }
      @media (max-width: 600px) {
        .container { margin: 0 0 24px 0; border-radius: 0; }
        .content { padding: 24px 8vw 18px 8vw; }
        .header { padding: 24px 8vw 12px 8vw; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://pla.creator.lefil.com.br/_next/image?url=%2Fassets%2FlogoCreatorBranca.png&w=640&q=75" alt="Logo Creator" class="logo">
        <h1>Recuperação de Senha</h1>
      </div>
      <div class="content">
        <h2>Olá, ${userName}!</h2>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta na plataforma Creator.</p>
        <p>Para criar uma nova senha, clique no botão abaixo. Este link é seguro e exclusivo para você.</p>
        <div class="button-container">
          <a href="${resetUrl}" class="reset-button">Redefinir Minha Senha</a>
        </div>
        <div class="warning">
          <strong>Atenção:</strong> Este link expirará em 30 minutos e só pode ser usado uma vez.
        </div>
        <p>Se o botão não funcionar, copie e cole o seguinte link no seu navegador:</p>
        <div class="url-fallback">${resetUrl}</div>
        <p style="margin-top: 24px;">Caso você não tenha solicitado esta redefinição, pode ignorar este e-mail com segurança.</p>
      </div>
      <div class="footer">
        <p><strong>Creator - Plataforma de Criação de Conteúdo</strong></p>
        <p style="font-size: 12px; margin-top: 10px;">© ${new Date().getFullYear()} Creator. Todos os direitos reservados.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}
