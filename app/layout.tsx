// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Creator AI',
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
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-grow bg-background">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}