'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowRight, Loader2, Lock, LogOut, Mail, User, UserPlus } from 'lucide-react';
import { useAuth } from "@/components/providers/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserWidget() {
    const { user, profile, signOut } = useAuth();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!email || !password) {
            toast.warning("Preencha e-mail e senha.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                toast.error("Não foi possível entrar. Confira seu e-mail e sua senha.");
                return;
            }

            toast.success("Login realizado com sucesso!");
            setOpen(false);
            setPassword("");
            router.refresh();
        } catch {
            toast.error("Erro inesperado ao realizar login.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex size-9 gap-2 px-0 text-secondary hover:bg-primary/10 hover:text-primary md:h-9 md:w-auto md:px-3"
                        aria-label="Abrir acesso à conta"
                    >
                        <User className="h-5 w-5" />
                        <span className="hidden flex-col items-start text-left text-xs md:flex">
                            <span className="opacity-70">Olá, Visitante</span>
                            <span className="font-semibold">Entrar ou cadastrar</span>
                        </span>
                    </Button>
                </PopoverTrigger>

                <PopoverContent align="end" sideOffset={10} className="w-[min(360px,calc(100vw-2rem))] border-0 bg-transparent p-0 shadow-none">
                    <Card className="gap-0 overflow-hidden rounded-2xl py-0 shadow-xl">
                        <CardHeader className="bg-muted/50 px-5 py-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <User className="size-4" />
                                </span>
                                Acesse sua conta
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Consulte pedidos, endereços e favoritos.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-5">
                            <form className="space-y-4" onSubmit={handleLogin}>
                                <div className="space-y-1.5">
                                    <Label htmlFor="navbar-login-email" className="text-xs">E-mail</Label>
                                    <div className="relative">
                                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="navbar-login-email"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="seuemail@exemplo.com"
                                            value={email}
                                            onChange={(event) => setEmail(event.target.value)}
                                            className="h-10 pl-9 text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="navbar-login-password" className="text-xs">Senha</Label>
                                    <div className="relative">
                                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="navbar-login-password"
                                            type="password"
                                            autoComplete="current-password"
                                            placeholder="Sua senha"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            className="h-10 pl-9 text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button type="submit" disabled={isSubmitting} className="h-10 w-full gap-2 font-semibold">
                                    {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                                    {isSubmitting ? "Entrando..." : "Entrar na conta"}
                                </Button>

                                <Button asChild variant="link" size="sm" className="h-auto w-full text-xs">
                                    <Link href="/login" onClick={() => setOpen(false)}>
                                        Abrir página completa de login
                                    </Link>
                                </Button>
                            </form>
                        </CardContent>

                        <CardFooter className="flex-col bg-muted/30 px-5 py-4">
                            <CardDescription className="mb-2 text-xs">Ainda não é cliente?</CardDescription>
                            <Button asChild variant="outline" className="h-10 w-full gap-2 border-primary/40 text-primary hover:bg-primary/10">
                                <Link href="/registro" onClick={() => setOpen(false)}>
                                    <UserPlus className="size-4" />
                                    Criar meu cadastro
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </PopoverContent>
            </Popover>
        );
    }

    // Lógica de fallback para nome
    const displayName = profile?.nomerazaosocial || user.user_metadata?.name || user.email || 'Cliente';
    const initial = displayName.charAt(0).toUpperCase();
    const firstName = displayName.split(' ')[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex size-9 gap-2 px-0 text-primary hover:bg-primary/10 hover:text-primary md:h-9 md:w-auto md:px-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {initial}
                    </div>
                    <div className="hidden flex-col items-start text-left text-xs md:flex">
                        <span className="opacity-70">Olá, {firstName}</span>
                        <span className="font-semibold">Minha Conta</span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/conta" className="cursor-pointer">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/pedidos" className="cursor-pointer">Meus Pedidos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/favoritos" className="cursor-pointer">Favoritos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/enderecos" className="cursor-pointer">Endereços</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
