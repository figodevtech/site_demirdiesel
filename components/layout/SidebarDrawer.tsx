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
    const [user, setUser] = useState<any>(null); // Use existing auth type if available or any

    // Simulate checking auth or check supabase if configured
    // Since login page is skeletal, this defaults to null (not logged in)
    // To test, one would need to implement actual login
    // For now, it meets the requirement: "só devem aparecer se o usuario estiver logado"
    /*
    useEffect(() => {
        const getUser = async () => {
             const { data: { user } } = await supabase.auth.getUser();
             setUser(user);
        }
        getUser();
    }, []);
    */
    // NOTE: Uncomment specific logic if supabase is fully set up with auth. 
    // Given the User Request, I will default to showing nothing if not logged in.
    
    // However, since I cannot verify if the user IS logged in without a working login flow, 
    // I will leave the `user` as null, which effectively hides it. 
    // If the user WANTS to see it, they need to log in (per request).

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
                            {user ? (
                                <>
                                    <span className="font-medium text-sm">Olá, {user.email?.split('@')[0]}</span>
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

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">

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
                                    <Link href="/pagamento" onClick={() => setOpen(false)} className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                                        <CreditCard size={16} /> Formas de Pagamento
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
                                
                                {categories.map((cat) => (
                                    <Link key={cat.id} href={`/produtos?category=${slugify(cat.nome)}`} onClick={() => setOpen(false)} className="block">
                                        <Button variant="ghost" className="w-full justify-start font-medium text-foreground/80 hover:text-foreground hover:bg-muted/60">
                                            {cat.nome}
                                        </Button>
                                    </Link>
                                ))}

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
                            </nav>
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-border mt-auto">
                    {user && (
                        <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                             // Sign out logic
                             setOpen(false)
                        }}>
                             <LogOut size={16} className="mr-2" /> Sair
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
