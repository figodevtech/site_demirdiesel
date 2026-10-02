"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  MailCheck,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  cleanCpfCnpj,
  formatCpfCnpj,
  formatPhone,
  isValidCpfCnpj,
} from "@/lib/auth-utils";
import { ensureCustomerProfile } from "@/lib/customer-profile";
import { supabase } from "@/lib/supabase";

type PersonType = "FISICA" | "JURIDICA";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro ao realizar cadastro.";
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [personType, setPersonType] = useState<PersonType>("FISICA");
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !document || !phone || !email.trim() || !password) {
      toast.warning("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!isValidCpfCnpj(document, personType)) {
      toast.error(personType === "FISICA" ? "CPF inválido." : "CNPJ inválido.");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }

    if (!acceptedTerms) {
      toast.warning("Aceite a Política de Privacidade para continuar.");
      return;
    }

    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const cleanDocument = cleanCpfCnpj(document);
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?redirect=/conta&confirmed=1`,
          data: {
            name: name.trim(),
            person_type: personType,
            cpf_cnpj: cleanDocument,
            phone: phone.trim(),
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Não foi possível criar o usuário.");

      if (!data.session) {
        setPendingConfirmationEmail(normalizedEmail);
        return;
      }

      await ensureCustomerProfile(data.user, {
        name,
        personType,
        document: cleanDocument,
        email: normalizedEmail,
        phone,
      });

      toast.success("Conta criada com sucesso!");
      router.replace("/conta");
      router.refresh();
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error(error);
      toast.error(
        message.includes("duplicate") || message.includes("unique")
          ? "Este CPF/CNPJ ou e-mail já está associado a outro cadastro."
          : message,
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendConfirmation() {
    if (!pendingConfirmationEmail) return;
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pendingConfirmationEmail,
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

  if (pendingConfirmationEmail) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
        <Card className="w-full max-w-md gap-0 overflow-hidden rounded-2xl py-0 text-center shadow-xl shadow-slate-950/10">
          <CardContent className="space-y-5 px-6 py-8 sm:px-8">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MailCheck className="size-7" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Confirme sua conta</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Enviamos um link de confirmação para <strong className="text-foreground">{pendingConfirmationEmail}</strong>.
              </p>
            </div>
            <p className="rounded-xl bg-muted/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              Abra o e-mail e clique no link para liberar o acesso. Verifique também a caixa de spam.
            </p>
            <div className="grid gap-3">
              <Button asChild className="h-11 w-full">
                <Link href="/login?redirect=/conta">Ir para o login</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResendConfirmation}
                disabled={isResending}
                className="h-11 w-full"
              >
                {isResending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {isResending ? "Reenviando..." : "Reenviar e-mail"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
          Já tenho conta
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
        <Link href="/" aria-label="Demir Diesel - início" className="mb-5">
          <Image
            src="/brand/demir-logo.avif"
            alt="Demir Diesel"
            width={256}
            height={99}
            priority
            className="h-auto w-36"
          />
        </Link>

        <Card className="w-full max-w-2xl gap-0 overflow-hidden rounded-2xl py-0 shadow-xl shadow-slate-950/10">
          <CardHeader className="gap-2 px-6 pb-5 pt-7 text-center sm:px-8">
            <CardTitle className="text-2xl font-bold tracking-tight">Criar sua conta</CardTitle>
            <CardDescription>
              Informe somente os dados básicos. O endereço será cadastrado depois.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleRegister}>
            <CardContent className="space-y-5 px-6 pb-7 sm:px-8">
              <Tabs value={personType} onValueChange={(value) => setPersonType(value as PersonType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="FISICA">Pessoa física</TabsTrigger>
                  <TabsTrigger value="JURIDICA">Pessoa jurídica</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="register-name">
                    {personType === "FISICA" ? "Nome completo" : "Razão social"}
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="h-11 pl-10"
                      autoComplete="name"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-document">
                    {personType === "FISICA" ? "CPF" : "CNPJ"}
                  </Label>
                  <div className="relative">
                    <FileText className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-document"
                      value={document}
                      onChange={(event) => setDocument(formatCpfCnpj(event.target.value))}
                      className="h-11 pl-10 font-mono"
                      inputMode="numeric"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-phone">Telefone / WhatsApp</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(formatPhone(event.target.value))}
                      className="h-11 pl-10 font-mono"
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="register-email">E-mail</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-11 pl-10"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-11 px-10"
                      autoComplete="new-password"
                      placeholder="Mínimo de 6 caracteres"
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

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="register-confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="h-11 pl-10"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="register-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(value) => setAcceptedTerms(value === true)}
                />
                <Label
                  htmlFor="register-terms"
                  className="text-xs font-normal leading-relaxed text-muted-foreground"
                >
                  Li e concordo com a{" "}
                  <Link href="/politica-de-privacidade" className="font-semibold text-primary hover:underline">
                    Política de Privacidade
                  </Link>
                  .
                </Label>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-primary/5 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                Seus dados serão utilizados somente para identificação, pedidos e pagamentos.
              </div>

              <Button type="submit" size="lg" disabled={isLoading} className="h-12 w-full font-bold">
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                {isLoading ? "Criando conta..." : "Criar conta"}
              </Button>
            </CardContent>

            <CardFooter className="justify-center bg-muted/50 px-6 py-5 sm:px-8">
              <p className="text-sm text-muted-foreground">
                Já possui uma conta?{" "}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Entrar
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
