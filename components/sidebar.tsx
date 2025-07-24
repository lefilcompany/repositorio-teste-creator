import Link from 'next/link';
import { Home, Sparkles } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 bg-card p-6 border-r-2 border-primary/10 flex-col hidden lg:flex">
      <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-10">
        Creator
      </div>
      <nav className="flex flex-col gap-4">
        <Link href="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
          <Home className="h-5 w-5 text-accent" />
          <span className="font-medium">Home</span>
        </Link>
        <Link href="/creator" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
          <Sparkles className="h-5 w-5 text-accent" />
          <span className="font-medium">Criar Conteúdo</span>
        </Link>
      </nav>
    </aside>
  );
}