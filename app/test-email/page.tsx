// app/test-email/page.tsx
import EmailPreview from '@/components/auth/EmailPreview';

export default function TestEmailPage() {
  // Esta página só deve estar disponível em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Esta página só está disponível em desenvolvimento.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Preview do E-mail de Recuperação</h1>
          <p className="text-gray-600 mb-6">
            Esta é uma prévia de como o e-mail de recuperação de senha aparecerá para os usuários.
          </p>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <EmailPreview />
          </div>
        </div>
      </div>
    </div>
  );
}
