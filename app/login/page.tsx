"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning("Preencha e-mail e senha.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Falha ao entrar: " + error.message);
      } else {
        toast.success("Login realizado com sucesso!");
        router.push(redirect);
        router.refresh();
      }
    } catch {
      toast.error("Erro inesperado ao realizar login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card rounded-3xl border border-border/80 p-8 shadow-xl">
      <div className="text-center mb-8">
        {/* Brand Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="inline-block transition-transform hover:scale-105" aria-label="Página Inicial Demir Diesel">
            <Image
              src="/images/demir-logo.png"
              alt="Demir Diesel"
              width={220}
              height={85}
              className="h-11 w-auto object-contain dark:hidden"
            />
            <Image
              src="/images/demir-logo-dark.png"
              alt="Demir Diesel"
              width={220}
              height={85}
              className="h-11 w-auto object-contain hidden dark:block"
            />
          </Link>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Acesse sua Conta
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Acompanhe seus pedidos, orçamentos e lista de peças
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            E-mail
          </Label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9 h-11 text-xs rounded-xl"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Senha
            </Label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 h-11 text-xs rounded-xl"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-xl text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Entrando...
            </>
          ) : (
            <>
              <span>Entrar na Conta</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-border/60 text-center">
        <p className="text-xs text-muted-foreground">
          Ainda não tem cadastro?{" "}
          <Link href="/registro" className="text-primary font-bold hover:underline">
            Cadastre-se agora
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-muted-foreground">Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
