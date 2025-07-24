export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
        Bem-vindo ao Creator
      </h1>
      <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
        Sua nova plataforma de IA para criação de conteúdo visual e textual de forma rápida e inteligente.
      </p>
      <p className="mt-6 text-muted-foreground">
        Navegue até a seção "Criar Conteúdo" na barra lateral para começar a sua jornada criativa.
      </p>
    </div>
  );
}