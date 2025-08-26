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
        /* Estilos Gerais */
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f7f5fa; /* Tom suave de roxo do background */
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
          overflow: hidden; /* Garante que os cantos arredondados sejam aplicados */
        }
        .header {
          background: linear-gradient(135deg, hsl(330, 100%, 38%), hsl(269, 66%, 48%)); /* Gradiente com as cores primária e secundária */
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .logo {
          max-width: 150px;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: hsl(228, 21%, 17%); /* Cor do foreground */
          font-size: 22px;
          margin-bottom: 20px;
        }
        .content p {
          margin-bottom: 20px;
          color: hsl(0, 0%, 48%); /* Cor do muted-foreground */
          font-size: 16px;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .reset-button {
          display: inline-block;
          background: linear-gradient(135deg, hsl(330, 100%, 38%), hsl(269, 66%, 48%));
          color: white;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 50px; /* Botão "pílula" */
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .reset-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
        .footer {
          background-color: hsl(0, 0%, 90%); /* Cor do muted */
          padding: 25px;
          text-align: center;
        }
        .footer p {
          margin: 0;
          color: hsl(0, 0%, 48%);
          font-size: 14px;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffeaa7;
          padding: 15px;
          margin: 20px 0;
          color: #856404;
        }
        .url-fallback {
          margin-top: 20px;
          padding: 15px;
          background-color: hsl(0, 0%, 90%);
          border-radius: 8px;
          font-size: 13px;
          word-break: break-all;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
                    <img src="/assets/logoCreatorPreta.png" alt="Logo Creator" class="logo">
          <h1>Recuperação de Senha</h1>
        </div>
        
        <div class="content">
          <h2>Olá, ${userName}!</h2>
          
          <p>Recebemos uma solicitação para redefinir a senha da sua conta na plataforma Creator.</p>
          
          <p>Para criar uma nova senha, clique no botão abaixo. Este link é seguro e exclusivo para você.</p>
          
          <div class="button-container">
            <a href="${resetUrl}" class="reset-button">
              Redefinir Minha Senha
            </a>
          </div>
          
          <div class="warning">
            <strong>Atenção:</strong> Este link expirará em 30 minutos e só pode ser usado uma vez.
          </div>
          
          <p>Se o botão não funcionar, copie e cole o seguinte link no seu navegador:</p>
          <div class="url-fallback">
            ${resetUrl}
          </div>
          
          <p>Caso você não tenha solicitado esta redefinição, pode ignorar este e-mail com segurança.</p>
        </div>
        
        <div class="footer">
          <p><strong>Creator - Plataforma de Criação de Conteúdo</strong></p>
          <p style="font-size: 12px; margin-top: 10px;">
            © ${new Date().getFullYear()} Creator. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
