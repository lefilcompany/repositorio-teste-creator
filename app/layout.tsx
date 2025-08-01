// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/sidebar'
import TopBar from '@/components/topbar' // Importe o novo componente

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
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          {/* Contêiner para a TopBar e o conteúdo principal */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar />
            {/* A área principal agora tem a rolagem */}
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}

//Layout com mudança de tema

// import './globals.css'
// import { Inter } from 'next/font/google'
// import Sidebar from '@/components/sidebar'
// import TopBar from '@/components/topbar'
// import { ThemeProvider } from '@/components/theme-provider' // 🎨 **Importe o provider**

// const inter = Inter({ subsets: ['latin'] })

// export const metadata = {
//   title: 'Creator',
//   description: 'Crie imagens e posts incríveis com inteligência artificial',
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     // Adicione suppressHydrationWarning aqui
//     <html lang="pt-BR" className={inter.className} suppressHydrationWarning>
//       <body>
//         {/* Envolva todo o conteúdo com o ThemeProvider */}
//         <ThemeProvider
//           attribute="class"
//           defaultTheme="system"
//           enableSystem
//           disableTransitionOnChange
//         >
//           <div className="flex h-screen overflow-hidden bg-background">
//             <Sidebar />
//             <div className="flex flex-1 flex-col overflow-hidden">
//               <TopBar />
//               <main className="flex-1 overflow-y-auto">
//                 {children}
//               </main>
//             </div>
//           </div>
//         </ThemeProvider>
//       </body>
//     </html>
//   )
// }