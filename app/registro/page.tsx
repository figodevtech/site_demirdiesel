'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { formatCpfCnpj, cleanCpfCnpj, formatPhone } from "@/lib/auth-utils";
import { useAuth } from "@/components/providers/AuthContext";

export default function RegisterPage() {
    const router = useRouter();
    const { refreshProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Estados do formulário
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [tipoPessoa, setTipoPessoa] = useState('FISICA');
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [phone, setPhone] = useState('');

    const handleRegister = async () => {
        // Validações básicas
        if (!name || !email || !password || !cpfCnpj || !phone) {
            toast.error("Preencha todos os campos obrigatórios.");
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

        setIsLoading(true);

        try {
            // 1. Criar usuário no Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name
                    }
                }
            });

            if (authError) throw authError;

            // Verifica se temos sessão (se Email Confirm estiver ligado, session será null)
            if (!authData.session) {
                console.log("Usuário criado, mas sem sessão ativa. Provavelmente requer confirmação de email.");
                toast.success("Conta criada! Verifique seu email para confirmar o cadastro antes de entrar.");
                router.push('/login');
                return;
            }

            if (authData.user) {
                console.log("Sessão ativa detectada. Tentando criar perfil...");
                
                // 2. Criar registro na tabela cliente
                const { error: dbError } = await supabase.from('cliente').insert({
                    user_id: authData.user.id,
                    nomerazaosocial: name,
                    tipopessoa: tipoPessoa,
                    cpfcnpj: cleanCpfCnpj(cpfCnpj),
                    email: email,
                    telefone: phone,
                    cidade: 'Não Informado', // valores padrão para satisfazer NOT NULL
                    estado: 'NI'
                });

                if (dbError) {
                    console.error("Erro no insert cliente:", JSON.stringify(dbError));
                    // Se falhar o insert mas criou o auth, o usuário fica num estado inconsistente.
                    // Ideal seria remover o auth user ou tratar isso.
                    // Para MVP, apenas avisamos.
                    toast.error(`Erro ao criar perfil: ${dbError.message || JSON.stringify(dbError)}`);
                } else {
                    toast.success("Conta criada com sucesso! Faça login para continuar.");
                    await refreshProfile(); // força atualização do contexto
                    router.push('/login');
                }
            }
        } catch (error: any) {
            console.error("Erro no registro:", JSON.stringify(error));
            toast.error(error.message || "Erro ao criar conta.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-[600px] items-center justify-center py-10 px-4 bg-muted/30">
            <Card className="w-full max-w-lg bg-white shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold text-secondary">Crie sua conta</CardTitle>
                    <CardDescription>
                        Preencha os dados abaixo para se cadastrar
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">

                    <div className="space-y-2">
                        <Label>Tipo de Cliente</Label>
                        <RadioGroup 
                            defaultValue="FISICA" 
                            className="flex gap-4"
                            onValueChange={setTipoPessoa}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="FISICA" id="pf" />
                                <Label htmlFor="pf">Pessoa Física</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="JURIDICA" id="pj" />
                                <Label htmlFor="pj">Empresa</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo / Razão Social</Label>
                        <Input 
                            id="name" 
                            placeholder="Seu nome ou nome da empresa" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="doc">{tipoPessoa === 'FISICA' ? 'CPF' : 'CNPJ'}</Label>
                            <Input 
                                id="doc" 
                                placeholder={tipoPessoa === 'FISICA' ? '000.000.000-00' : '00.000.000/0000-00'}
                                value={cpfCnpj}
                                onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                                maxLength={18}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone / Celular</Label>
                            <Input 
                                id="phone" 
                                placeholder="(00) 00000-0000" 
                                value={phone}
                                onChange={(e) => setPhone(formatPhone(e.target.value))}
                                maxLength={15}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="nome@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirmar Senha</Label>
                            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                    </div>

                    <Button className="w-full mt-4" onClick={handleRegister} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Criar Conta
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-t pt-6 bg-muted/10">
                    <p className="text-xs text-muted-foreground text-center">
                        Já possui conta?{" "}
                        <Link href="/login" className="text-primary hover:underline font-semibold">
                            Faça login
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
