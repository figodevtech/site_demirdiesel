'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { useState, Suspense } from "react";

function LoginForm() {
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';
    const [email, setEmail] = useState('');

    const handleLogin = () => {
        if (!email) return;
        login(email, 'Usuário Teste');
        router.push(redirect);
    };

    return (
        <Card className="w-full max-w-sm bg-white shadow-lg">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold text-secondary">Acesse sua conta</CardTitle>
                <CardDescription>
                    Entre com seus dados para continuar
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="nome@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" type="password" />
                </div>
                <Button className="w-full mt-2" onClick={handleLogin}>Entrar</Button>
                <div className="text-center text-xs">
                    <Link href="#" className="text-primary hover:underline">
                        Esqueceu sua senha?
                    </Link>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 border-t pt-6 bg-muted/10">
                <p className="text-xs text-muted-foreground text-center">
                    Não tem uma conta?{" "}
                    <Link href="/registro" className="text-primary hover:underline font-semibold">
                        Registre-se agora
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="flex min-h-[500px] items-center justify-center py-10 px-4 bg-muted/30">
            <Suspense fallback={<div className="text-center">Carregando...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
