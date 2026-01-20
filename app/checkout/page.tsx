'use client';

import { useEffect, useState } from 'react';
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
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Address State
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState('pagarme');
    const [shippingPrice, setShippingPrice] = useState<number | null>(null);
    const [calculatingShipping, setCalculatingShipping] = useState(false);

    // New Address Form State
    const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
    const [cep, setCep] = useState('');
    const [logradouro, setLogradouro] = useState('');
    const [numero, setNumero] = useState('');
    const [complemento, setComplemento] = useState('');
    const [bairro, setBairro] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');
    const [savingAddress, setSavingAddress] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login?redirect=/checkout');
            } else if (profile?.id) {
                fetchAddresses();
            } else {
                 // Profile loading...
            }
        }
    }, [user?.id, profile?.id, authLoading, router]);

    const calculateShipping = async (cep: string) => {
        if (!cep) return;
        setCalculatingShipping(true);
        // Simulate "Correios" API call like in cart page
        await new Promise(resolve => setTimeout(resolve, 1500));
        setShippingPrice(29.90); // Custom mock price for checkout
        setCalculatingShipping(false);
    };

    useEffect(() => {
        if (selectedAddressId && addresses.length > 0) {
            const addr = addresses.find(a => a.id === selectedAddressId);
            if (addr) {
                calculateShipping(addr.cep);
            }
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
            toast.error("Erro ao carregar endereços.");
        } else {
            setAddresses(data || []);
            // Pre-select first address if available
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
                console.error("Erro ao buscar CEP", error);
            }
        }
    };

    const handleSaveAddress = async () => {
        if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
            toast.warning("Preencha os campos obrigatórios.");
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

            toast.success("Endereço adicionado!");
            setIsAddressDialogOpen(false);
            
            // Refresh list and select new address
            await fetchAddresses();
            setSelectedAddressId(data.id);
            
            // Reset form
            setCep('');
            setLogradouro('');
            setNumero('');
            setComplemento('');
            setBairro('');
            setCidade('');
            setEstado('');
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar endereço.");
        } finally {
            setSavingAddress(false);
        }
    };

    if (authLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Seu carrinho está vazio</h2>
                <Button onClick={() => router.push('/produtos')}>Voltar para loja</Button>
            </div>
        );
    }

    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [isWaitingPayment, setIsWaitingPayment] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

    const checkOrderStatus = async () => {
        if (!currentOrderId) return;
        setIsCheckingStatus(true);
        console.log("DEBUG: Manually checking order status for ID:", currentOrderId);
        
        try {
            const { data, error } = await supabase
                .from('pedido')
                .select('status')
                .eq('id', currentOrderId)
                .single();

            if (data && (data.status === 'PAGO' || data.status === 'AUTORIZADO' || data.status === 'PENDENTE')) {
                // If it's already in DB, and has a valid status, we can consider checking more specifically
                // but for now, if the user says they paid, and we found the record, let's allow them to see success
                // or redirect to orders.
                console.log("DEBUG: Order found in DB with status:", data.status);
                if (data.status !== 'PENDENTE') {
                    clearCart();
                    router.push('/sucesso');
                } else {
                    toast.info("O pedido foi registrado, mas o pagamento ainda consta como Pendente. Aguarde a confirmação do banco.");
                }
            }
        } catch (err) {
            console.error("Error polling order status:", err);
        } finally {
            setIsCheckingStatus(false);
        }
    };

    // Realtime confirmation
    useEffect(() => {
        if (!currentOrderId || !isWaitingPayment) return;

        console.log("DEBUG: Setting up Realtime subscription for order:", currentOrderId);

        const channel = supabase
            .channel(`order_status_${currentOrderId}`)
            .on(
                'postgres_changes', 
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'pedido',
                    filter: `id=eq.${currentOrderId}`
                }, 
                (payload) => {
                    console.log("DEBUG: Realtime Update Received:", payload.new);
                    const newStatus = payload.new.status?.toUpperCase();
                    
                    if (newStatus === 'PAGO' || newStatus === 'AUTORIZADO') {
                        console.log("DEBUG: Status is PAID! Redirecting...");
                        toast.success("Pagamento confirmado!");
                        clearCart();
                        router.push('/sucesso');
                    }
                }
            )
            .subscribe((status) => {
                console.log("DEBUG: Realtime Subscription Status:", status);
            });

        return () => {
            console.log("DEBUG: Cleaning up Realtime subscription");
            supabase.removeChannel(channel);
        };
    }, [currentOrderId, isWaitingPayment, clearCart, router]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Log for debugging
            console.log("DEBUG: Message received in Checkout:", event.data);
            console.log("DEBUG: Message origin:", event.origin);
            
            if (event.data === 'payment_success') {
                console.log("DEBUG: SUCCESS! Redirecting to success page...");
                clearCart();
                router.push('/sucesso');
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [clearCart, router]);

    const handleCheckout = async () => {
        if (!selectedAddressId) {
            toast.error("Selecione um endereço de entrega.");
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

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao processar checkout');
            }

            if (result.url) {
                setPaymentUrl(result.url);
                setCurrentOrderId(result.orderId);
                setIsWaitingPayment(true);
                
                // Open in a new smaller window
                const width = 600;
                const height = 800;
                const left = (window.innerWidth / 2) - (width / 2);
                const top = (window.innerHeight / 2) - (height / 2);
                
                const popup = window.open(
                    result.url, 
                    'PagarMeCheckout', 
                    `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
                );

                if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                    toast.warning("O bloqueador de popups impediu a abertura automática. Clique no botão abaixo.");
                }
            } else {
               toast.error("Erro: URL de pagamento não retornada.");
            }

        } catch (error: any) {
            console.error("Checkout Error:", error);
            toast.error(error.message || "Erro ao iniciar pagamento.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isWaitingPayment && paymentUrl) {
        return (
            <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
                <Card className="border-primary/20 shadow-xl">
                    <CardHeader>
                        <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                        <CardTitle className="text-2xl">Aguardando Pagamento</CardTitle>
                        <CardDescription>
                            Uma janela de pagamento foi aberta. Por favor, complete a transação na outra janela.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-muted/30 p-6 rounded-lg border border-dashed text-sm">
                            <p className="mb-2 font-medium">Não viu a janela de pagamento?</p>
                            <Button variant="outline" onClick={() => window.open(paymentUrl, 'PagarMeCheckout')} className="gap-2">
                                <Plus size={16} /> Abrir Janela Novamente
                            </Button>
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Após finalizar o pagamento, você será redirecionado automaticamente ou poderá clicar abaixo.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button onClick={checkOrderStatus} disabled={isCheckingStatus} className="gap-2">
                                    {isCheckingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck size={18} />}
                                    Verificar Pagamento
                                </Button>
                                <Button variant="outline" onClick={() => router.push('/pedidos')} className="gap-2">
                                    <CheckCircle2 size={18} /> Ver Meus Pedidos
                                </Button>
                                <Button variant="ghost" onClick={() => setIsWaitingPayment(false)}>
                                    Voltar e alterar dados
                                </Button>
                            </div>
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
                {/* Left Column: Forms */}
                <div className="md:col-span-2 space-y-6">
                    
                    {/* Address Selection */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div className="flex items-center gap-2">
                                <MapPin className="text-primary h-5 w-5" />
                                <CardTitle className="text-lg">Endereço de Entrega</CardTitle>
                            </div>
                            <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Plus size={16} /> Novo Endereço
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Adicionar Novo Endereço</DialogTitle>
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
                                        <Button onClick={handleSaveAddress} disabled={savingAddress}>
                                            {savingAddress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Endereço"}
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
                                    Nenhum endereço cadastrado. Adicione um para continuar.
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

                    {/* Payment Info Box */}
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2 pb-4">
                            <CreditCard className="text-primary h-5 w-5" />
                            <CardTitle className="text-lg">Pagamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="bg-muted/30 p-4 rounded-md border border-border/50 text-sm">
                                <p className="flex items-center gap-2 text-muted-foreground">
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                    Você será redirecionado para o ambiente seguro do <strong>Pagar.me</strong> para finalizar o pagamento via Cartão, PIX ou Boleto.
                                </p>
                           </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Order Summary */}
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
                                        <span className="text-xs text-muted-foreground italic">Selecione endereço</span>
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
