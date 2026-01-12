'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, LogOut } from 'lucide-react';
import { useAuth } from "@/components/providers/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserWidget() {
    const { user, logout } = useAuth();

    if (!user) {
        return (
            <Link href="/login">
                <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-secondary hover:text-primary hover:bg-primary/10">
                    <User className="h-5 w-5" />
                    <div className="flex flex-col items-start text-xs text-left">
                        <span className="opacity-70">Olá, Visitante</span>
                        <span className="font-semibold">Entrar</span>
                    </div>
                </Button>
            </Link>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-primary hover:text-primary hover:bg-primary/10">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col items-start text-xs text-left">
                        <span className="opacity-70">Olá, {user.name.split(' ')[0]}</span>
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
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
