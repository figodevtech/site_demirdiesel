"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AccountSectionHeader, AccountShell } from "@/components/account/AccountShell";
import { useAuth } from "@/components/providers/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export default function AccountSecurityPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?redirect=/conta/seguranca");
  }, [isLoading, router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      toast.warning("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      toast.warning("Use pelo menos uma letra maiúscula, uma minúscula e um número.");
      return;
    }
    if (password !== confirmation) {
      toast.error("A confirmação não corresponde à nova senha.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirmation("");
      toast.success("Senha alterada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar sua senha.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Carregando segurança da conta...</span>
      </div>
    );
  }

  return (
    <AccountShell>
      <AccountSectionHeader
        icon={KeyRound}
        title="Segurança"
        description="Altere sua senha e proteja o acesso à sua conta."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="min-h-[30rem] border-0 shadow-lg shadow-slate-900/8 dark:shadow-black/25">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LockKeyhole className="size-5 text-primary" />
              Alterar senha
            </CardTitle>
            <CardDescription>Escolha uma senha diferente da utilizada anteriormente.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    className="h-11 pr-11"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="new-password"
                  className="h-11"
                  required
                />
              </div>

              <div className="rounded-xl bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
                Use no mínimo 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula e um número.
              </div>

              <Button type="submit" disabled={saving} className="h-11 w-full gap-2 font-semibold sm:w-auto">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                {saving ? "Alterando..." : "Alterar senha"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Alert className="h-fit border-0 bg-primary/[0.07] shadow-sm">
          <ShieldCheck className="size-4 text-primary" />
          <AlertTitle>Proteja sua conta</AlertTitle>
          <AlertDescription className="leading-relaxed">
            Não reutilize a senha do seu e-mail ou de outros serviços. Nunca enviaremos mensagens solicitando sua senha.
          </AlertDescription>
        </Alert>
      </div>
    </AccountShell>
  );
}
