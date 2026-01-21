'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ProdutoGrupo } from '@/lib/types';
import { slugify } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ProductFiltersProps {
    categories: ProdutoGrupo[];
}

export function ProductFilters({ categories }: ProductFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Estado da URL
    const categoriaAtual = searchParams.get('category');
    const precoMinInfo = searchParams.get('minPrice');
    const precoMaxInfo = searchParams.get('maxPrice');

    const [intervaloPreco, setIntervaloPreco] = useState([0, 5000]);

    useEffect(() => {
        if (precoMinInfo || precoMaxInfo) {
           setIntervaloPreco([Number(precoMinInfo) || 0, Number(precoMaxInfo) || 5000]);
        }
    }, [precoMinInfo, precoMaxInfo]);


    const alternarCategoria = (slug: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (categoriaAtual === slug) {
            params.delete('category'); // desmarcar
        } else {
            params.set('category', slug);
        }
        router.push(`/produtos?${params.toString()}`);
    };

    const alterarPreco = (valor: number[]) => {
        setIntervaloPreco(valor);
    };

    const aplicarFiltroPreco = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('minPrice', intervaloPreco[0].toString());
        params.set('maxPrice', intervaloPreco[1].toString());
        router.push(`/produtos?${params.toString()}`);
    };

    const limparFiltros = () => {
        router.push('/produtos');
        setIntervaloPreco([0, 5000]);
    };

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-secondary">Categorias</h3>
                    {(categoriaAtual || searchParams.has('minPrice')) && (
                         <Button variant="ghost" size="sm" onClick={limparFiltros} className="h-auto p-0 text-xs text-destructive hover:bg-transparent">
                            Limpar
                        </Button>
                    )}
                </div>
                <div className="space-y-2">
                     <button
                        onClick={() => alternarCategoria('todos')} 
                        className={cn(
                            "flex items-center justify-between w-full text-sm text-left px-2 py-1.5 rounded-md transition-colors",
                             !categoriaAtual ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <span>Todos os Produtos</span>
                        {!categoriaAtual && <Check size={14} />}
                    </button>
                    {categories.map((cat) => {
                        const slug = slugify(cat.nome);
                        const isActive = categoriaAtual === slug;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => alternarCategoria(slug)}
                                className={cn(
                                    "flex items-center justify-between w-full text-sm text-left px-2 py-1.5 rounded-md transition-colors",
                                     isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <span>{cat.nome}</span>
                                {isActive && <Check size={14} />}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <h3 className="font-semibold text-secondary mb-4">Preço</h3>
                <div className="space-y-4 px-2">
                    <Slider
                        defaultValue={[0, 5000]}
                        min={0}
                        max={5000}
                        step={50}
                        value={intervaloPreco}
                        onValueChange={alterarPreco}
                        onValueCommit={aplicarFiltroPreco}
                        className="py-4"
                    />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>R$ {intervaloPreco[0]}</span>
                        <span>R$ {intervaloPreco[1]}+</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
