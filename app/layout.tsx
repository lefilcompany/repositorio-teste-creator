// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/hooks/useAuth';

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
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}