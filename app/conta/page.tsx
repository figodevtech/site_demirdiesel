'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2, User as UserIcon, Save } from 'lucide-react';
import { formatPhone } from '@/lib/auth-utils';

export default function ContaPage() {
    const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
    const router = useRouter();
    
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (profile?.id) {
            setName(profile.nomerazaosocial || '');
            setPhone(profile.telefone || '');
        }
    }, [user?.id, profile?.id, authLoading, router]);

    if (authLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    if (!user) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('cliente')
                .update({ 
                    nomerazaosocial: name,
                    telefone: phone 
                })
                .eq('user_id', user.id);

            if (error) throw error;

            toast.success("Perfil atualizado com sucesso!");
            await refreshProfile();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar perfil.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
                <UserIcon className="text-primary" /> Meu Perfil
            </h1>

            <div className="max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Informações Pessoais</CardTitle>
                        <CardDescription>Gerencie seus dados de cadastro</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user.email} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>CPF/CNPJ</Label>
                                <Input value={profile?.cpfcnpj || ''} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Input value={profile?.tipopessoa === 'FISICA' ? 'Pessoa Física' : 'Pessoa Jurídica'} disabled className="bg-muted" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo / Razão Social</Label>
                            <Input 
                                id="name" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone / Celular</Label>
                            <Input 
                                id="phone" 
                                value={phone} 
                                onChange={(e) => setPhone(formatPhone(e.target.value))}
                                maxLength={15}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Alterações
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
