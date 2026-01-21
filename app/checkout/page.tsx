'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import { useCart } from '@/components/providers/CartContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, MapPin, Plus, Truck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function CheckoutPage() {
    const { user, profile, isLoading: authLoading } = useAuth();
    const { items, subtotal, clearCart } = useCart();
    const router = useRouter();

    // Endereço
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
    const [cep, setCep] = useState('');
    const [logradouro, setLogradouro] = useState('');
    const [numero, setNumero] = useState('');
    const [complemento, setComplemento] = useState('');
    const [bairro, setBairro] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');
    const [savingAddress, setSavingAddress] = useState(false);

    // Pedido
    const [isProcessing, setIsProcessing] = useState(false);
    const [shippingPrice, setShippingPrice] = useState<number | null>(null);
    const [calculatingShipping, setCalculatingShipping] = useState(false);

    // Pagamento
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [isWaitingPayment, setIsWaitingPayment] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
    const clearedRef = useRef(false);

    // Autenticação inicial
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login?redirect=/checkout');
            } else if (profile?.id) {
                fetchAddresses();
            }
        }
    }, [user?.id, profile?.id, authLoading, router]);

    const calculateShipping = async (cepValue: string) => {
        if (!cepValue) return;
        setCalculatingShipping(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setShippingPrice(29.90);
        setCalculatingShipping(false);
    };

    useEffect(() => {
        if (selectedAddressId && addresses.length > 0) {
            const addr = addresses.find(a => a.id === selectedAddressId);
            if (addr) calculateShipping(addr.cep);
        }
    }, [selectedAddressId, addresses]);

    const fetchAddresses = async () => {
        setLoadingAddresses(true);
        const { data, error } = await supabase
            .from('cliente_endereco')
            .select('*')
            .eq('cliente_id', profile.id)
            .order('id', { ascending: true });
        if (error) {
            console.error(error);
            toast.error('Erro ao carregar enderecos.');
        } else {
            setAddresses(data || []);
            if (data && data.length > 0 && !selectedAddressId) {
                setSelectedAddressId(data[0].id);
            }
        }
        setLoadingAddresses(false);
    };

    const handleCepBlur = async () => {
        if (cep.length >= 8) {
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
                console.error('Erro ao buscar CEP', error);
            }
        }
    };

    const handleSaveAddress = async () => {
        if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
            toast.warning('Preencha os campos obrigatorios.');
            return;
        }

        setSavingAddress(true);
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

            const { data, error } = await supabase
                .from('cliente_endereco')
                .insert(addressData)
                .select()
                .single();

            if (error) throw error;

            toast.success('Endereco adicionado!');
            setIsAddressDialogOpen(false);
            await fetchAddresses();
            setSelectedAddressId(data.id);
            setCep('');
            setLogradouro('');
            setNumero('');
            setComplemento('');
            setBairro('');
            setCidade('');
            setEstado('');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar endereco.');
        } finally {
            setSavingAddress(false);
        }
    };

    const checkOrderStatus = async () => {
        if (!currentOrderId) return;
        setIsCheckingStatus(true);
        try {
            const { data } = await supabase
                .from('pedido')
                .select('status')
                .eq('id', currentOrderId)
                .single();

            if (data && (data.status === 'PAGO' || data.status === 'AUTORIZADO' || data.status === 'PENDENTE')) {
                if (data.status !== 'PENDENTE') {
                    setPaymentStatus('paid');
                    if (!clearedRef.current) {
                        clearedRef.current = true;
                        clearCart();
                    }
                } else {
                    toast.info('Pedido registrado, pagamento pendente.');
                }
            }
        } catch (err) {
            console.error('Error polling order status:', err);
        } finally {
            setIsCheckingStatus(false);
        }
    };

    // Atualização em tempo real (Supabase)
    useEffect(() => {
        if (!currentOrderId || !isWaitingPayment) return;
        const channel = supabase
            .channel(`order_status_${currentOrderId}`)
            .on(
                'postgres_changes', 
                { event: 'UPDATE', schema: 'public', table: 'pedido', filter: `id=eq.${currentOrderId}` },
                (payload) => {
                    const newStatus = payload.new.status?.toUpperCase();
                    if (newStatus === 'PAGO' || newStatus === 'AUTORIZADO') {
                        toast.success('Pagamento confirmado!');
                        setPaymentStatus('paid');
                        if (!clearedRef.current) {
                            clearedRef.current = true;
                            clearCart();
                        }
                    }
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentOrderId, isWaitingPayment, clearCart]);

    // Mensagem enviada pelo popup
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data === 'payment_success') {
                setPaymentStatus('paid');
                if (!clearedRef.current) {
                    clearedRef.current = true;
                    clearCart();
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [clearCart]);

    const handleCheckout = async () => {
        if (!selectedAddressId) {
            toast.error('Selecione um endereco de entrega.');
            return;
        }

        setIsProcessing(true);
        try {
            const selectedAddress = addresses.find(a => a.id === selectedAddressId);
            const checkoutData = {
                items,
                shippingAmount: shippingPrice,
                customerId: profile.id,
                customerName: profile.nomerazaosocial || user.user_metadata?.name || 'Cliente',
                customerEmail: user.email,
                customerDocument: profile.cpfcnpj || '',
                customerPhone: profile.telefone || '',
                address: selectedAddress
            };

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(checkoutData)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erro ao processar checkout');

            if (result.url) {
                setPaymentUrl(result.url);
                setCurrentOrderId(result.orderId);
                setIsWaitingPayment(true);
                setPaymentStatus('pending');

                const width = 600;
                const height = 800;
                const left = (window.innerWidth / 2) - (width / 2);
                const top = (window.innerHeight / 2) - (height / 2);
                const popup = window.open(result.url, 'PagarMeCheckout', `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`);
                if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                    toast.warning('O bloqueador de popups impediu a abertura automatica. Clique no botao abaixo.');
                }
            } else {
                toast.error('Erro: URL de pagamento nao retornada.');
            }
        } catch (error: any) {
            console.error('Checkout Error:', error);
            toast.error(error.message || 'Erro ao iniciar pagamento.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Tela de aguardando/confirmado
    if (isWaitingPayment && paymentUrl) {
        const paid = paymentStatus === 'paid';
        return (
            <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
                <Card className="border-primary/20 shadow-xl">
                    <CardHeader>
                        {paid ? (
                            <>
                                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                                <CardTitle className="text-2xl">Pagamento confirmado</CardTitle>
                                <CardDescription>Seu pedido foi aprovado.</CardDescription>
                            </>
                        ) : (
                            <>
                                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                                <CardTitle className="text-2xl">Aguardando pagamento</CardTitle>
                                <CardDescription>Complete o pagamento na outra janela.</CardDescription>
                            </>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!paid && (
                            <Button variant="outline" onClick={() => window.open(paymentUrl, 'PagarMeCheckout')} className="gap-2 w-full">
                                <Plus size={16} /> Abrir janela novamente
                            </Button>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {!paid && (
                                <Button onClick={checkOrderStatus} disabled={isCheckingStatus} className="gap-2">
                                    {isCheckingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck size={18} />}
                                    Verificar pagamento
                                </Button>
                            )}
                            <Button variant={paid ? 'default' : 'outline'} onClick={() => router.push('/pedidos')} className="gap-2">
                                <CheckCircle2 size={18} /> Ver meus pedidos
                            </Button>
                            <Button variant="ghost" onClick={() => router.push('/')}>Voltar para loja</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <h1 className="text-3xl font-bold text-secondary mb-8">Finalizar Pedido</h1>
            
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div className="flex items-center gap-2">
                                <MapPin className="text-primary h-5 w-5" />
                                <CardTitle className="text-lg">Endereco de Entrega</CardTitle>
                            </div>
                            <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Plus size={16} /> Novo Endereco
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Adicionar Novo Endereco</DialogTitle>
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
                                                <Label>Numero</Label>
                                                <Input value={numero} onChange={e => setNumero(e.target.value)} />
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <Label>Complemento</Label>
                                                <Input value={complemento} onChange={e => setComplemento(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleSaveAddress} disabled={savingAddress}>
                                            {savingAddress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Endereco"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {loadingAddresses ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
                            ) : addresses.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg">
                                    Nenhum endereco cadastrado. Adicione um para continuar.
                                </div>
                            ) : (
                                <RadioGroup value={selectedAddressId?.toString()} onValueChange={(val) => setSelectedAddressId(Number(val))}>
                                    <div className="grid gap-4">
                                        {addresses.map((addr) => (
                                            <div key={addr.id} className={`flex items-start space-x-2 border rounded-lg p-4 cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-border'}`} onClick={() => setSelectedAddressId(addr.id)}>
                                                <RadioGroupItem value={addr.id.toString()} id={`addr-${addr.id}`} className="mt-1" />
                                                <div className="grid gap-1.5 leading-none">
                                                    <Label htmlFor={`addr-${addr.id}`} className="font-semibold cursor-pointer">
                                                        {addr.logradouro}, {addr.numero}
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        {addr.bairro} - {addr.cidade}/{addr.estado}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">CEP: {addr.cep}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2 pb-4">
                            <CreditCard className="text-primary h-5 w-5" />
                            <CardTitle className="text-lg">Pagamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="bg-muted/30 p-4 rounded-md border border-border/50 text-sm">
                                <p className="flex items-center gap-2 text-muted-foreground">
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                    Voce sera redirecionado para o ambiente seguro do <strong>Pagar.me</strong> para finalizar o pagamento via cartao, PIX ou boleto.
                                </p>
                           </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-1">
                    <Card className="sticky top-24 shadow-lg border-primary/10">
                        <CardHeader className="bg-muted/10">
                            <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-border/30 last:border-0">
                                        <span className="truncate max-w-[180px] text-muted-foreground">
                                            <span className="font-bold text-foreground">{item.quantity}x</span> {item.product.name}
                                        </span>
                                        <span className="font-medium shrink-0">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                 <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1"><Truck size={12}/> Frete</span>
                                    {calculatingShipping ? (
                                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                    ) : shippingPrice !== null ? (
                                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(shippingPrice)}</span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Selecione endereco</span>
                                    )}
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-xl">
                                    <span>Total</span>
                                    <span className="text-primary">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal + (shippingPrice || 0))}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/10 pb-6 pt-2">
                             <Button 
                                className="w-full py-6 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" 
                                onClick={handleCheckout}
                                disabled={isProcessing || items.length === 0 || !selectedAddressId || calculatingShipping}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Inciando Pagamento...
                                    </>
                                ) : calculatingShipping ? (
                                    "Calculando Frete..."
                                ) : (
                                    `Ir para Pagamento`
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                    
                    <div className="mt-4 text-center text-xs text-muted-foreground">
                        <p>Compra 100% segura e processada por Pagar.me</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
