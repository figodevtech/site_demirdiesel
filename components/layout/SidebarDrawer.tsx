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
import { Menu, User, Package, MapPin, CreditCard, Heart, HelpCircle, LogOut } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProdutoGrupo } from '@/lib/types';
import { slugify } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
    categories: ProdutoGrupo[];
}

export default function SidebarDrawer({ categories }: SidebarProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <Menu className="h-6 w-6 text-primary" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] flex flex-col p-0" title="Menu Principal">
                {/* Helper for acessibility title if needed, or VisuallyHidden */}
                <div className="sr-only">Menu de Navegação</div>

                <SheetHeader className="p-6 border-b border-border bg-sidebar-accent/50">
                    <SheetTitle className="text-left text-primary font-bold text-xl">
                        Demir Diesel
                    </SheetTitle>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                            <User size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-sm">Bem-vindo, Visitante</span>
                            <Link href="/login" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-primary underline">
                                Entre ou cadastre-se
                            </Link>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">

                        {/* Minha Conta Section */}
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
                                <Link href="/pagamento" onClick={() => setOpen(false)} className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                                    <CreditCard size={16} /> Formas de Pagamento
                                </Link>
                                <Link href="/favoritos" onClick={() => setOpen(false)} className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                                    <Heart size={16} /> Lista de Desejos
                                </Link>
                            </nav>
                        </div>

                        {/* Departamentos Section */}
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Departamentos</h4>
                            <nav className="space-y-1">
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/categoria/${slugify(cat.nome || '')}`}
                                        onClick={() => setOpen(false)}
                                        className="flex items-center justify-between px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors group"
                                    >
                                        <span>{cat.nome}</span>
                                        <span className="text-muted-foreground group-hover:text-primary text-xs">Ver</span>
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* Suporte Section */}
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Ajuda</h4>
                            <nav className="space-y-1">
                                <Link href="/faq" onClick={() => setOpen(false)} className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                                    <HelpCircle size={16} /> Central de Ajuda
                                </Link>
                            </nav>
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-border mt-auto">
                    <Link href="/login" onClick={() => setOpen(false)} className="flex items-center gap-3 px-2 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors">
                        <LogOut size={16} /> Sair
                    </Link>
                </div>
            </SheetContent>
        </Sheet>
    );
}
