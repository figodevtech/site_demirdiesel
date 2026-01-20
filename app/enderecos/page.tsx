'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2, MapPin, Plus, Trash2, Edit2 } from 'lucide-react';

export default function EnderecosPage() {
    const { user, profile, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Form State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [cep, setCep] = useState('');
    const [logradouro, setLogradouro] = useState('');
    const [numero, setNumero] = useState('');
    const [complemento, setComplemento] = useState('');
    const [bairro, setBairro] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (profile?.id) {
                fetchAddresses();
            } else {
                setLoading(false);
            }
        }
    }, [user?.id, profile?.id, authLoading, router]);

    const fetchAddresses = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('cliente_endereco')
            .select('*')
            .eq('cliente_id', profile.id)
            .order('id', { ascending: true });
        
        if (error) {
            console.error(error);
            toast.error("Erro ao carregar endereços.");
        } else {
            setAddresses(data || []);
        }
        setLoading(false);
    };

    const handleCepBlur = async () => {
        if (cep.length === 8 || cep.length === 9) {
            const cleanCep = cep.replace(/\D/g, '');
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setLogradouro(data.logradouro);
                    setBairro(data.bairro);
                    setCidade(data.localidade);
                    setEstado(data.uf);
                }
            } catch (error) {
                console.error("Erro ao buscar CEP", error);
            }
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setCep('');
        setLogradouro('');
        setNumero('');
        setComplemento('');
        setBairro('');
        setCidade('');
        setEstado('');
    };

    const handleEdit = (addr: any) => {
        setEditingId(addr.id);
        setCep(addr.cep);
        setLogradouro(addr.logradouro);
        setNumero(addr.numero);
        setComplemento(addr.complemento || '');
        setBairro(addr.bairro);
        setCidade(addr.cidade);
        setEstado(addr.estado);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir este endereço?")) return;

        const { error } = await supabase.from('cliente_endereco').delete().eq('id', id);
        if (error) {
            toast.error("Erro ao excluir endereço.");
        } else {
            setAddresses(addresses.filter(a => a.id !== id));
            toast.success("Endereço removido.");
        }
    };

    const handleSave = async () => {
        if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
            toast.warning("Preencha os campos obrigatórios.");
            return;
        }

        setSaving(true);
        try {
            const addressData = {
                cliente_id: profile.id,
                cep,
                logradouro,
                numero,
                complemento,
                bairro,
                cidade,
                estado
            };

            let error;
            if (editingId) {
                const res = await supabase.from('cliente_endereco').update(addressData).eq('id', editingId);
                error = res.error;
            } else {
                const res = await supabase.from('cliente_endereco').insert(addressData);
                error = res.error;
            }

            if (error) throw error;

            toast.success(editingId ? "Endereço atualizado!" : "Endereço adicionado!");
            setIsDialogOpen(false);
            fetchAddresses();
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar endereço.");
        } finally {
            setSaving(false);
        }
    };

    if (authLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <MapPin className="text-primary" /> Meus Endereços
                </h1>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Novo Endereço</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Editar Endereço" : "Adicionar Endereço"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>CEP</Label>
                                    <Input value={cep} onChange={e => setCep(e.target.value)} onBlur={handleCepBlur} placeholder="00000-000" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Estado (UF)</Label>
                                    <Input value={estado} onChange={e => setEstado(e.target.value)} maxLength={2} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Cidade</Label>
                                <Input value={cidade} onChange={e => setCidade(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Bairro</Label>
                                <Input value={bairro} onChange={e => setBairro(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Logradouro</Label>
                                <Input value={logradouro} onChange={e => setLogradouro(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Número</Label>
                                    <Input value={numero} onChange={e => setNumero(e.target.value)} />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Complemento</Label>
                                    <Input value={complemento} onChange={e => setComplemento(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
            ) : addresses.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/10">
                    Nenhum endereço cadastrado.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {addresses.map((addr) => (
                        <Card key={addr.id} className="relative group">
                            <CardHeader>
                                <CardTitle className="text-base">{addr.logradouro}, {addr.numero}</CardTitle>
                                <CardDescription>{addr.bairro} - {addr.cidade}/{addr.estado}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">CEP: {addr.cep}</p>
                                {addr.complemento && <p className="text-sm text-muted-foreground">{addr.complemento}</p>}
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(addr)}>
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(addr.id)} className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
