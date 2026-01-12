import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function RegisterPage() {
    return (
        <div className="flex min-h-[500px] items-center justify-center py-10 px-4 bg-muted/30">
            <Card className="w-full max-w-md bg-white shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold text-secondary">Crie sua conta</CardTitle>
                    <CardDescription>
                        Comece a comprar e agendar serviços com facilidade
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input id="name" placeholder="Seu nome" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastname">Sobrenome</Label>
                            <Input id="lastname" placeholder="Sobrenome" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo de Cliente</Label>
                        <RadioGroup defaultValue="pessoa-fisica" className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="pessoa-fisica" id="pf" />
                                <Label htmlFor="pf">Pessoa Física</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="juridica" id="pj" />
                                <Label htmlFor="pj">Empresa</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="nome@exemplo.com" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input id="password" type="password" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Senha</Label>
                        <Input id="confirm-password" type="password" />
                    </div>

                    <Button className="w-full mt-4">Criar Conta</Button>
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
