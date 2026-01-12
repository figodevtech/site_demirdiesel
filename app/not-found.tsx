import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';
import SearchInput from '@/components/layout/SearchInput';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center py-20">
      <h1 className="text-9xl font-extrabold text-primary opacity-20 select-none">404</h1>
      
      <div className="absolute flex flex-col items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-secondary">Página não encontrada</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-4">
          O conteúdo que você procurou não existe ou foi movido. Tente fazer uma busca ou voltar para o início.
        </p>
        
        <div className="w-full max-w-xs mb-4">
            <SearchInput className="shadow-md" />
        </div>

        <Link href="/">
          <Button size="lg" className="min-w-[150px]">
             Voltar ao Início
          </Button>
        </Link>
      </div>
    </div>
  );
}
