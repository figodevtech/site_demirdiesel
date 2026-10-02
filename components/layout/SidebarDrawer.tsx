'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, User, Package, MapPin, Heart, HelpCircle, LogOut, MessageCircle, PackageCheck } from 'lucide-react';
import { ProdutoGrupo } from '@/lib/types';
import type { PublicCategory } from '@/lib/catalog/types';
import { formatCategoryName, slugify } from '@/lib/utils';
import { buildWhatsAppUrl } from '@/lib/site-config';
import { useState } from 'react';

import { useAuth } from "@/components/providers/AuthContext";

interface SidebarProps {
    categories: Array<ProdutoGrupo | PublicCategory>;
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
                <Button aria-label="Abrir menu principal" variant="ghost" size="icon" className="hover:bg-primary/10">
                    <Menu className="h-6 w-6 text-primary" />
                </Button>
            </SheetTrigger>
            <SheetContent
                side="left"
                className="w-[300px] sm:w-[350px] flex flex-col p-0 h-[100dvh] max-h-[100dvh] overflow-hidden bg-background"
                title="Menu Principal"
            >
                <div className="sr-only">Menu de Navegação</div>

                <SheetHeader className="p-6 border-b border-primary/20 bg-secondary/[0.035] shrink-0">
                    <SheetTitle className="text-left">
                        <Image
                            src="/brand/demir-logo.avif"
                            alt="Demir Diesel"
                            width={256}
                            height={99}
                            className="h-auto w-36"
                            sizes="144px"
                        />
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
                                <Link href="/conta" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted active:bg-muted transition-colors">
                                    <User size={16} /> Perfil
                                </Link>
                                <Link href="/pedidos" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted active:bg-muted transition-colors">
                                    <Package size={16} /> Meus Pedidos
                                </Link>
                                <Link href="/enderecos" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted active:bg-muted transition-colors">
                                    <MapPin size={16} /> Endereços
                                </Link>
                                <Link href="/favoritos" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted active:bg-muted transition-colors">
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
                                    <Package size={16} /> Catálogo completo
                                </Button>
                            </Link>
                            <Link href="/produtos?estoque=disponivel" onClick={() => setOpen(false)} className="block">
                                <Button variant="ghost" className="w-full justify-start gap-2.5 font-medium text-foreground/80 hover:bg-muted/60 hover:text-foreground">
                                    <PackageCheck size={16} className="text-primary" /> Pronta entrega
                                </Button>
                            </Link>
                            <Link href="/favoritos" onClick={() => setOpen(false)} className="block">
                                <Button variant="ghost" className="w-full justify-start font-medium text-foreground/80 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 gap-2.5">
                                    <Heart size={16} className="text-rose-500 fill-rose-500/20" />
                                    <span>Meus Favoritos</span>
                                </Button>
                            </Link>
                            
                            <div className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Departamentos</div>
                            {categories.map((cat) => {
                                const catName = formatCategoryName("name" in cat ? cat.name : cat.nome);
                                const catSlug = "slug" in cat ? cat.slug : slugify(catName);
                                return (
                                    <Link key={cat.id} href={`/produtos?category=${catSlug}`} onClick={() => setOpen(false)} className="block">
                                        <Button variant="ghost" className="w-full justify-start font-medium text-foreground/80 hover:text-foreground hover:bg-muted/60">
                                            {catName}
                                        </Button>
                                    </Link>
                                );
                            })}

                        </nav>
                    </div>

                    {/* Suporte Section */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Ajuda</h4>
                        <nav className="space-y-1">
                            <Link href="/duvidas-frequentes" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted active:bg-muted transition-colors">
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
