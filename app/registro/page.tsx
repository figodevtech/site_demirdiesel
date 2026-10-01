"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MapPinned,
  PackageCheck,
  Phone,
  ShieldCheck,
  Truck,
  User,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/providers/AuthContext";
import { supabase } from "@/lib/supabase";
import { cleanCpfCnpj, formatCpfCnpj, formatPhone, isValidCpfCnpj } from "@/lib/auth-utils";

type PersonType = "FISICA" | "JURIDICA";

function formatCep(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro ao realizar cadastro.";
}

export default function RegisterPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tipoPessoa, setTipoPessoa] = useState<PersonType>("FISICA");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [phone, setPhone] = useState("");

  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!response.ok) throw new Error("Falha ao consultar o CEP.");

      const data = await response.json();
      if (data.erro) {
        toast.warning("CEP não encontrado. Preencha o endereço manualmente.");
        return;
      }

      setLogradouro(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setEstado(data.uf || "");
    } catch {
      toast.warning("Não foi possível consultar o CEP. Preencha o endereço manualmente.");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name || !email || !password || !cpfCnpj || !phone) {
      toast.warning("Preencha todos os dados pessoais obrigatórios.");
      return;
    }

    if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
      toast.warning("Preencha todos os campos obrigatórios do endereço.");
      return;
    }

    if (!acceptedTerms) {
      toast.warning("Aceite a Política de Privacidade para continuar.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (!isValidCpfCnpj(cpfCnpj, tipoPessoa)) {
      toast.error(tipoPessoa === "FISICA" ? "CPF inválido." : "CNPJ inválido.");
      return;
    }

    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: name.trim(),
            person_type: tipoPessoa,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Não foi possível criar o usuário.");

      if (!authData.session) {
        toast.success("Conta criada! Confirme seu e-mail e faça login para concluir o endereço.");
        router.push("/login?redirect=/enderecos");
        return;
      }

      const { data: existingProfile, error: profileLookupError } = await supabase
        .from("cliente")
        .select("id")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (profileLookupError) throw profileLookupError;

      let clientId = existingProfile?.id as number | undefined;
      if (!clientId) {
        const { data: createdProfile, error: profileError } = await supabase
          .from("cliente")
          .insert({
            user_id: authData.user.id,
            nomerazaosocial: name.trim(),
            tipopessoa: tipoPessoa,
            cpfcnpj: cleanCpfCnpj(cpfCnpj),
            email: normalizedEmail,
            telefone: phone.trim(),
          })
          .select("id")
          .single();

        if (profileError) throw profileError;
        clientId = createdProfile.id;
      }

      const { error: addressError } = await supabase.from("cliente_endereco").insert({
        cliente_id: clientId,
        cep: formatCep(cep),
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        complemento: complemento.trim() || null,
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
        principal: true,
      });

      if (addressError) throw addressError;

      toast.success("Cadastro e endereço concluídos com sucesso!");
      await refreshProfile();
      router.push("/conta");
      router.refresh();
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error(error);
      toast.error(
        message.includes("duplicate") || message.includes("unique")
          ? "Este CPF/CNPJ ou e-mail já está associado a outro cadastro."
          : message
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-linear-to-b from-primary/10 via-background to-background px-4 py-5 sm:py-6">
      <Card className="mx-auto grid w-full max-w-7xl gap-0 overflow-hidden rounded-3xl py-0 shadow-xl lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="relative overflow-hidden bg-secondary p-7 text-secondary-foreground">
          <div className="absolute -right-24 -top-24 size-64 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative flex h-full flex-col">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                Cadastro da loja
              </p>
              <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight">
                Sua conta pronta para comprar peças.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-blue-100">
                Informe seus dados uma única vez e agilize pagamento, entrega e acompanhamento dos pedidos.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {[
                { icon: PackageCheck, text: "Histórico e situação dos pedidos" },
                { icon: Truck, text: "Endereço salvo para próximas compras" },
                { icon: ShieldCheck, text: "Dados protegidos e compra segura" },
              ].map(({ icon: Icon, text }) => (
                <div className="flex items-center gap-3 text-sm text-blue-50" key={text}>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                    <Icon className="size-4" />
                  </span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-10 text-xs text-blue-100">
              Já possui uma conta?{" "}
              <Link href="/login" className="font-bold text-white underline underline-offset-4">
                Fazer login
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <CardHeader className="bg-primary/5 px-5 py-4 sm:px-7">
            <CardTitle className="text-xl font-extrabold sm:text-2xl">Criar sua conta</CardTitle>
            <CardDescription>
              Complete seus dados pessoais, acesso e endereço principal.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleRegister}>
            <CardContent className="grid items-start gap-5 px-5 py-5 sm:px-7 lg:grid-cols-2 lg:grid-rows-[auto_auto_auto]">
              <section aria-labelledby="personal-data-title" className="space-y-3 lg:col-start-1 lg:row-start-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 id="personal-data-title" className="font-bold text-foreground">Dados do cliente</h2>
                    <p className="text-xs text-muted-foreground">Informações usadas nos pedidos e cobranças.</p>
                  </div>
                  <Tabs value={tipoPessoa} onValueChange={(value) => setTipoPessoa(value as PersonType)}>
                    <TabsList className="grid w-full grid-cols-2 sm:w-[260px]">
                      <TabsTrigger value="FISICA">Pessoa física</TabsTrigger>
                      <TabsTrigger value="JURIDICA">Pessoa jurídica</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="register-name">
                      {tipoPessoa === "FISICA" ? "Nome completo" : "Razão social"}*
                    </Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="register-name" value={name} onChange={(event) => setName(event.target.value)} className="h-10 pl-9 lg:h-9" required />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="register-document">{tipoPessoa === "FISICA" ? "CPF" : "CNPJ"}*</Label>
                    <div className="relative">
                      <FileText className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="register-document" value={cpfCnpj} onChange={(event) => setCpfCnpj(formatCpfCnpj(event.target.value))} className="h-10 pl-9 font-mono lg:h-9" required />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="register-phone">Telefone / WhatsApp*</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="register-phone" type="tel" value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} className="h-10 pl-9 font-mono lg:h-9" required />
                    </div>
                  </div>
                </div>
              </section>

              <Separator className="lg:hidden" />

              <section aria-labelledby="access-data-title" className="space-y-3 lg:col-start-1 lg:row-start-2">
                <div>
                  <h2 id="access-data-title" className="font-bold text-foreground">Dados de acesso</h2>
                  <p className="text-xs text-muted-foreground">Use um e-mail válido para acessar e acompanhar suas compras.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="register-email">E-mail*</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="register-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-10 pl-9 lg:h-9" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="register-password">Senha*</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="register-password" type="password" autoComplete="new-password" placeholder="Mínimo de 6 caracteres" value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 pl-9 lg:h-9" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="register-confirm-password">Confirmar senha*</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="register-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-10 pl-9 lg:h-9" required />
                    </div>
                  </div>
                </div>
              </section>

              <Separator className="lg:hidden" />

              <section aria-labelledby="address-data-title" className="overflow-hidden rounded-2xl bg-secondary text-secondary-foreground shadow-xl shadow-slate-950/20 [&_label]:text-blue-50 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                <div className="flex flex-col gap-3 bg-white/5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
                      <MapPinned className="size-5" />
                    </span>
                    <div>
                      <h2 id="address-data-title" className="font-bold text-white">Endereço de entrega</h2>
                      <p className="text-xs text-blue-100">Este será seu endereço principal.</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-white/20 bg-white/10 text-cyan-100">
                    <WandSparkles className="size-3" />
                    Busca automática pelo CEP
                  </Badge>
                </div>

                <div className="space-y-3.5 p-4">
                  <div className="grid gap-x-3 gap-y-3 sm:grid-cols-6">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="register-cep">CEP*</Label>
                      <InputGroup className="h-10 bg-background text-foreground lg:h-9">
                        <InputGroupAddon>
                          <MapPin className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="register-cep"
                          value={cep}
                          onChange={(event) => setCep(formatCep(event.target.value))}
                          onBlur={handleCepBlur}
                          placeholder="00000-000"
                          className="font-mono"
                          aria-busy={isLoadingCep}
                          required
                        />
                        {isLoadingCep ? (
                          <InputGroupAddon align="inline-end">
                            <Loader2 className="size-4 animate-spin text-primary" />
                          </InputGroupAddon>
                        ) : null}
                      </InputGroup>
                    </div>
                    <div className="space-y-1.5 sm:col-span-4">
                      <Label htmlFor="register-street">Rua / Logradouro*</Label>
                      <Input id="register-street" value={logradouro} onChange={(event) => setLogradouro(event.target.value)} placeholder="Ex.: Rua das Oficinas" className="h-10 bg-background text-foreground lg:h-9" required />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="register-number">Número*</Label>
                      <Input id="register-number" value={numero} onChange={(event) => setNumero(event.target.value)} placeholder="Ex.: 125" className="h-10 bg-background text-foreground lg:h-9" required />
                    </div>
                    <div className="space-y-1.5 sm:col-span-4">
                      <Label htmlFor="register-complement">
                        Complemento <span className="font-normal text-blue-200">(opcional)</span>
                      </Label>
                      <Input id="register-complement" value={complemento} onChange={(event) => setComplemento(event.target.value)} placeholder="Apto, sala, galpão" className="h-10 bg-background text-foreground lg:h-9" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="register-neighborhood">Bairro*</Label>
                      <Input id="register-neighborhood" value={bairro} onChange={(event) => setBairro(event.target.value)} className="h-10 bg-background text-foreground lg:h-9" required />
                    </div>
                    <div className="space-y-1.5 sm:col-span-3">
                      <Label htmlFor="register-city">Cidade*</Label>
                      <Input id="register-city" value={cidade} onChange={(event) => setCidade(event.target.value)} className="h-10 bg-background text-foreground lg:h-9" required />
                    </div>
                    <div className="space-y-1.5 sm:col-span-1">
                      <Label htmlFor="register-state">UF*</Label>
                      <Input id="register-state" value={estado} onChange={(event) => setEstado(event.target.value.toUpperCase().slice(0, 2))} placeholder="PB" maxLength={2} className="h-10 bg-background text-center text-foreground uppercase lg:h-9" required />
                    </div>
                  </div>

                  <p className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[11px] leading-snug text-blue-100">
                    <Truck className="size-3.5 shrink-0 text-cyan-200" />
                    O frete e o prazo serão calculados com base neste endereço.
                  </p>
                </div>
              </section>

              <div className="flex items-start gap-3 lg:col-start-2 lg:row-start-3">
                <Checkbox id="register-terms" checked={acceptedTerms} onCheckedChange={(value) => setAcceptedTerms(value === true)} />
                <Label htmlFor="register-terms" className="text-xs font-normal leading-relaxed text-muted-foreground">
                  Li e concordo com a{" "}
                  <Link href="/politica-de-privacidade" className="font-semibold text-primary hover:underline">
                    Política de Privacidade
                  </Link>
                  .
                </Label>
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-3 bg-primary/5 px-5 py-4 sm:flex-row sm:justify-between sm:px-7">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary" />
                Campos com * são obrigatórios.
              </p>
              <Button type="submit" disabled={isLoading || isLoadingCep} className="h-11 w-full gap-2 px-7 font-bold sm:w-auto">
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                {isLoading ? "Criando cadastro..." : "Concluir cadastro"}
              </Button>
            </CardFooter>
          </form>
        </div>
      </Card>
    </div>
  );
}
