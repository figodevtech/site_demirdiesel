"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Send,
} from "lucide-react";
import { toast } from "sonner";
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
import { useAuth } from "@/components/providers/AuthContext";
import { ensureCustomerProfile } from "@/lib/customer-profile";
import { supabase } from "@/lib/supabase";

function safeRedirect(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));
  const { user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    void ensureCustomerProfile(user)
      .catch((profileError) => {
        console.warn("Não foi possível completar o perfil confirmado:", profileError);
      })
      .finally(() => {
        router.replace(redirect);
        router.refresh();
      });
  }, [authLoading, redirect, router, user]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.warning("Preencha e-mail e senha.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        const isEmailNotConfirmed =
          error.code === "email_not_confirmed" ||
          error.message.toLowerCase().includes("email not confirmed");

        if (isEmailNotConfirmed) {
          setNeedsConfirmation(true);
          toast.warning("Confirme seu e-mail antes de entrar.");
          return;
        }

        toast.error("Não foi possível entrar", {
          description: "Confira seu e-mail e sua senha e tente novamente.",
        });
        return;
      }

      if (!data.user) {
        toast.error("Não foi possível identificar sua conta.");
        return;
      }

      try {
        await ensureCustomerProfile(data.user);
      } catch (profileError) {
        console.warn("Não foi possível completar o perfil no login:", profileError);
      }

      toast.success("Login realizado com sucesso!");
      router.replace(redirect);
      router.refresh();
    } catch {
      toast.error("Erro inesperado ao realizar login.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendConfirmation() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.warning("Informe seu e-mail para reenviar a confirmação.");
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/login?redirect=/conta&confirmed=1`,
        },
      });

      if (error) throw error;
      toast.success("E-mail de confirmação reenviado.");
    } catch (error) {
      console.error("Erro ao reenviar confirmação:", error);
      toast.error("Não foi possível reenviar agora. Tente novamente em alguns minutos.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <Card className="w-full max-w-md gap-0 overflow-hidden rounded-2xl py-0 shadow-xl shadow-slate-950/10">
      <CardHeader className="gap-2 px-6 pb-5 pt-7 text-center sm:px-8">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Entre na sua conta
        </CardTitle>
        <CardDescription>
          Acesse seus pedidos, pagamentos e dados da conta.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-5 px-6 pb-7 sm:px-8">
          <div className="space-y-2">
            <Label htmlFor="login-email">E-mail</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 pl-10"
                disabled={isLoading}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="login-password">Senha</Label>
              <Link
                href="/fale-conosco"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 px-10"
                disabled={isLoading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
          </div>

          <Button type="submit" size="lg" disabled={isLoading} className="h-12 w-full font-bold">
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {isLoading ? "Entrando..." : "Continuar"}
          </Button>

          {needsConfirmation ? (
            <div className="space-y-3 rounded-xl bg-amber-50 p-4 text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-100 dark:ring-amber-900">
              <div>
                <p className="text-sm font-bold">Confirme seu e-mail</p>
                <p className="mt-1 text-xs leading-relaxed opacity-80">
                  Sua conta foi criada, mas o acesso só será liberado depois que você abrir o link enviado pelo Supabase.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendConfirmation}
                disabled={isResending}
                className="w-full bg-background"
              >
                {isResending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {isResending ? "Reenviando..." : "Reenviar confirmação"}
              </Button>
            </div>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl bg-primary/5 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            Seu acesso é protegido. Nunca compartilhe sua senha.
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-3 bg-muted/50 px-6 py-5 sm:px-8">
          <p className="text-sm text-muted-foreground">Ainda não possui uma conta?</p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/registro">Criar conta</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function LoginFallback() {
  return (
    <Card className="flex min-h-96 w-full max-w-md items-center justify-center">
      <Loader2 className="size-6 animate-spin text-primary" />
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col bg-slate-100 dark:bg-slate-950">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar para a loja
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10">
        <Link href="/" aria-label="Demir Diesel - início" className="mb-6">
          <Image
            src="/brand/demir-logo.avif"
            alt="Demir Diesel"
            width={256}
            height={99}
            priority
            className="h-auto w-40"
          />
        </Link>
        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
