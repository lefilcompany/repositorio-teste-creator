import Link from 'next/link';
import Image from 'next/image';
import { Home, Sparkles, CheckCircle, Tag, Target, Palette, Users } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 shadow-sm shadow-primary/20 bg-card p-6 flex-col hidden lg:flex">
      <Link href="/" className="mb-10">
        <Image
          src="/assets/logoCreatorPreta.png"
          alt="Logo Creator"
          width={150}
          height={40}
          priority
        />
      </Link>
      <nav className="flex flex-col gap-4">
        <Link href="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
          <Home className="h-5 w-5 text-accent" />
          <span className="font-medium">Home</span>
        </Link>
        <Link href="/marcas" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
          <Tag className="h-5 w-5 text-accent" />
          <span className="font-medium">Marcas</span>
        </Link>
        <Link href="/temas" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
          <Palette className="h-5 w-5 text-accent" />
          <span className="font-medium">Temas Estratégicos</span>
        </Link>
        <Link href="/personas" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
          <Users className="h-5 w-5 text-accent" />
          <span className="font-medium">Personas</span>
        </Link>
        <Link href="/creator" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
          <Sparkles className="h-5 w-5 text-accent" />
          <span className="font-medium">Criar Conteúdo</span>
        </Link>
        <Link href="/revisar" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
           <CheckCircle className="h-5 w-5 text-accent" />
          <span className="font-medium">Revisar Conteúdo</span>
        </Link>
      </nav>
    </aside>
  );
}