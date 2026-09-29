'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, User, Package, MapPin, CreditCard, Heart, HelpCircle, LogOut, MessageCircle } from 'lucide-react';
import { ProdutoGrupo } from '@/lib/types';
import { slugify } from '@/lib/utils';
import { buildWhatsAppUrl } from '@/lib/site-config';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from "@/components/providers/AuthContext";

interface SidebarProps {
    categories: ProdutoGrupo[];
    onOpenChange?: (open: boolean) => void;
}

export default function SidebarDrawer({ categories, onOpenChange }: SidebarProps) {
    const [open, setOpenInternal] = useState(false);
    const setOpen = (val: boolean) => {
        setOpenInternal(val);
        if (onOpenChange) onOpenChange(val);
    };
    const { user, profile, signOut } = useAuth();

    const displayName = profile?.nomerazaosocial || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Cliente';

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <Menu className="h-6 w-6 text-primary" />
                </Button>
            </SheetTrigger>
            <SheetContent
                side="left"
                className="w-[300px] sm:w-[350px] flex flex-col p-0 h-[100dvh] max-h-[100dvh] overflow-hidden bg-background"
                title="Menu Principal"
            >
                <div className="sr-only">Menu de Navegação</div>

                <SheetHeader className="p-6 border-b border-border bg-sidebar-accent/50 shrink-0">
                    <SheetTitle className="text-left text-primary font-bold text-xl">
                        Demir Diesel
                    </SheetTitle>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                            <User size={20} />
                        </div>
                        <div className="flex flex-col text-left min-w-0">
                            {user ? (
                                <>
                                    <span className="font-medium text-sm truncate max-w-[200px]">Olá, {displayName}</span>
                                    <span className="text-xs text-muted-foreground">Bem-vindo de volta</span>
                                </>
                            ) : (
                                <>
                                    <span className="font-medium text-sm">Bem-vindo, Visitante</span>
                                    <Link href="/login" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-primary underline">
                                        Entre ou cadastre-se
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </SheetHeader>

                {/* Conteúdo rolável vertical nativo com touch fluido e bounded flex height */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-6">
                    {/* Minha Conta Section - ONLY IF LOGGED IN */}
                    {user && (
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Minha Conta</h4>
                            <nav className="space-y-1">
                                <Link href="/conta" onClick={() => setOpen(false)} className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                                    <User size={16} /> Perfil
                                </Link>
                                <Link href="/pedidos" onClick={() => setOpen(false)} className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                                    <Package size={16} /> Meus Pedidos
                                </Link>
                                <Link href="/enderecos" onClick={() => setOpen(false)} className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                                    <MapPin size={16} /> Endereços
                                </Link>
                                <Link href="/favoritos" onClick={() => setOpen(false)} className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                                    <Heart size={16} /> Lista de Desejos
                                </Link>
                            </nav>
                        </div>
                    )}

                    {/* Loja/Produtos Section */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Loja</h4>
                        <nav className="space-y-1">
                            <Link href="/produtos" onClick={() => setOpen(false)} className="block">
                                <Button variant="ghost" className="w-full justify-start font-medium text-foreground/80 hover:text-foreground hover:bg-muted/60">
                                    Todos os Produtos
                                </Button>
                            </Link>
                            
                            {categories.map((cat: any) => {
                                const catName = cat.name || cat.nome || "Categoria";
                                const catSlug = cat.slug || slugify(catName);
                                return (
                                    <Link key={cat.id} href={`/produtos?category=${catSlug}`} onClick={() => setOpen(false)} className="block">
                                        <Button variant="ghost" className="w-full justify-start font-medium text-foreground/80 hover:text-foreground hover:bg-muted/60">
                                            {catName}
                                        </Button>
                                    </Link>
                                );
                            })}

                            <Link href="/ofertas" onClick={() => setOpen(false)} className="block mt-2">
                                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 font-medium">
                                    Ofertas do Dia
                                </Button>
                            </Link>
                        </nav>
                    </div>

                    {/* Suporte Section */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Ajuda</h4>
                        <nav className="space-y-1">
                            <Link href="/faq" onClick={() => setOpen(false)} className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                                <HelpCircle size={16} /> Central de Ajuda
                            </Link>
                            <a
                                href={buildWhatsAppUrl("Olá, preciso de ajuda técnica para encontrar uma peça diesel.")}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-3 px-2 py-2 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-md transition-colors font-medium"
                            >
                                <MessageCircle size={16} /> Falar com Técnico no WhatsApp
                            </a>
                        </nav>
                    </div>
                </div>

                <div className="p-4 border-t border-border mt-auto shrink-0 bg-background">
                    {user && (
                        <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                             signOut();
                             setOpen(false);
                        }}>
                             <LogOut size={16} className="mr-2" /> Sair
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
