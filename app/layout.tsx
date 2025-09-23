// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/hooks/useAuth';
import { UsageTracker } from '@/components/UsageTracker';
import TrialExpiredModal from '@/components/trial-expired-modal';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Creator',
  description: 'Crie imagens e posts incríveis com inteligência artificial',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={inter.className}>
      <body>
        <AuthProvider>
          <UsageTracker />
          <TrialExpiredModal />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}