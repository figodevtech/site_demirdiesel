"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Headphones,
  Loader2,
  Lock,
  Mail,
  PackageCheck,
  ShieldCheck,
  Truck,
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
import { supabase } from "@/lib/supabase";

const accountBenefits = [
  {
    icon: PackageCheck,
    title: "Pedidos em um só lugar",
    description: "Acompanhe pagamentos, notas fiscais e compras anteriores.",
  },
  {
    icon: Truck,
    title: "Entrega mais rápida",
    description: "Use seus endereços salvos nas próximas compras.",
  },
  {
    icon: ShieldCheck,
    title: "Compra segura",
    description: "Seus dados e pagamentos ficam protegidos.",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.warning("Preencha e-mail e senha.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        toast.error("Não foi possível entrar", {
          description: "Confira seu e-mail e sua senha e tente novamente.",
        });
        return;
      }

      toast.success("Login realizado com sucesso!");
      router.push(redirect);
      router.refresh();
    } catch {
      toast.error("Erro inesperado ao realizar login.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="grid w-full max-w-5xl gap-0 overflow-hidden rounded-3xl py-0 shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative overflow-hidden bg-secondary px-6 py-7 text-secondary-foreground sm:px-8 sm:py-9">
        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -bottom-28 -right-20 size-72 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative flex h-full flex-col">
          <Link
            href="/"
            className="w-fit rounded-xl bg-white px-3 py-2 shadow-sm transition-transform hover:scale-[1.02]"
            aria-label="Voltar para o início da Demir Diesel"
          >
            <Image
              src="/brand/demir-logo.avif"
              alt="Demir Diesel"
              width={256}
              height={99}
              priority
              className="h-auto w-[142px]"
            />
          </Link>

          <div className="mt-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
              Área do cliente
            </p>
            <h1 className="mt-3 max-w-md text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Sua oficina não pode esperar pela peça certa.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-blue-100">
              Entre para comprar, acompanhar seus pedidos e consultar todas as
              informações da entrega.
            </p>
          </div>

          <div className="mt-8 hidden space-y-4 sm:block">
            {accountBenefits.map(({ icon: Icon, title, description }) => (
              <div className="flex items-start gap-3" key={title}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                  <Icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-blue-100">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/fale-conosco"
            className="mt-8 inline-flex w-fit items-center gap-2 text-xs font-semibold text-blue-100 transition-colors hover:text-white sm:mt-auto sm:pt-10"
          >
            <Headphones className="size-4 text-cyan-200" />
            Precisa de ajuda para acessar?
          </Link>
        </div>
      </aside>

      <div className="min-w-0 bg-card">
        <CardHeader className="bg-primary/5 px-6 py-6 sm:px-9 sm:py-8">
          <Link
            href="/"
            className="mb-2 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-3.5" />
            Voltar para a loja
          </Link>
          <CardTitle className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Entre na sua conta
          </CardTitle>
          <CardDescription>
            Informe seus dados para continuar suas compras.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5 px-6 py-7 sm:px-9 sm:py-8">
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
                  className="h-11 rounded-xl pl-10"
                  disabled={isLoading}
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
                  Esqueceu a senha?
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
                  className="h-11 rounded-xl px-10"
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="h-11 w-full rounded-xl font-bold shadow-md shadow-primary/20"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              {isLoading ? "Entrando..." : "Entrar na conta"}
            </Button>

            <p className="flex items-start gap-2 rounded-xl bg-primary/5 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground shadow-sm shadow-primary/10">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              O acesso é protegido. Nunca compartilhe sua senha ou códigos de
              confirmação.
            </p>
          </CardContent>

          <CardFooter className="flex-col gap-3 bg-muted/30 px-6 py-5 sm:flex-row sm:justify-between sm:px-9">
            <p className="text-sm text-muted-foreground">
              Ainda não possui uma conta?
            </p>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/registro">Criar minha conta</Link>
            </Button>
          </CardFooter>
        </form>
      </div>
    </Card>
  );
}

function LoginFallback() {
  return (
    <Card className="flex min-h-[520px] w-full max-w-5xl items-center justify-center rounded-3xl shadow-xl">
      <Loader2 className="size-6 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Carregando acesso...</span>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100svh-8rem)] items-center bg-linear-to-b from-primary/10 via-background to-background px-4 py-6 sm:py-10">
      <div className="mx-auto flex w-full justify-center">
        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
