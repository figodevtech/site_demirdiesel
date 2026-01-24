import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Package, Heart } from 'lucide-react';
import SidebarDrawer from './SidebarDrawer';
import SearchInput from './SearchInput';
import { Badge } from "@/components/ui/badge";
import { buscarCategorias } from '@/lib/api';
import { slugify } from '@/lib/utils';
import CartWidget from './CartWidget';
import UserWidget from './UserWidget';

export default async function Navbar() {
    const categories = await buscarCategorias();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/90 drop-shadow-md drop-shadow-black/25">
            {/* Top Bar */}
            <div className="bg-secondary text-secondary-foreground text-xs py-1 px-4 text-center hidden md:block">
                <span className="font-medium">Frete Grátis</span> nas compras acima de R$ 299,00 para região Sul e Sudeste.
            </div>

            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Left: Logo & Sidebar */}
                <div className="flex items-center gap-2 md:gap-4">
                    <SidebarDrawer categories={categories} />
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-linear-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                            D
                        </div>
                        <span className="hidden md:inline-block font-bold text-xl tracking-tight text-secondary">
                            Demir<span className="text-primary">Diesel</span>
                        </span>
                    </Link>
                </div>

                {/* Center: Search */}
                <div className="flex-1 max-w-2xl mx-auto hidden md:block">
                    <SearchInput />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 md:gap-3">
                    <Link href="/favoritos">
                        <Button variant="ghost" size="icon" className="hidden sm:flex relative" aria-label="Favoritos">
                            <Heart className="h-5 w-5" />
                        </Button>
                    </Link>

                    <UserWidget />

                    <CartWidget />
                </div>
            </div>

            {/* Mobile Search Bar */}
            <div className="md:hidden px-4 pb-3">
                <SearchInput />
            </div>

            {/* Secondary Nav - Desktop */}
            <nav className="hidden md:flex border-t border-border/50 bg-muted/30">
                <div className="container mx-auto px-4">
                    <ul className="flex items-center gap-6 h-10 text-sm font-medium text-muted-foreground w-full overflow-x-auto no-scrollbar">
                        <li className="shrink-0"><Link href="/servicos" className="hover:text-primary transition-colors flex items-center gap-1"><Package className="h-4 w-4" /> Serviços da Oficina</Link></li>
                        <li className="h-4 w-px bg-border shrink-0"></li>
                        <li className="shrink-0 mr-auto">
                            <Link href="/produtos" className="hover:text-primary transition-colors font-semibold">
                                Todos os Produtos
                            </Link>
                        </li>
                        <li className="shrink-0 ml-auto"><Link href="/ofertas" className="hover:text-primary transition-colors text-destructive">Ofertas do Dia</Link></li>
                        <li className="shrink-0"><Link href="/fale-conosco" className="hover:text-primary transition-colors">Fale Conosco</Link></li>
                    </ul>
                </div>
            </nav>
        </header>
    );
}
