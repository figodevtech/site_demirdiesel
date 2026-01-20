'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Loader2, Package, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns'; // Would need date-fns, otherwise standard JS Date

export default function PedidosPage() {
    const { user, profile, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (profile?.id) {
                fetchOrders();

                // Setup Realtime for live updates
                console.log("DEBUG: Setting up Realtime for Orders page...");
                const channel = supabase
                    .channel('schema-db-changes')
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'pedido',
                            filter: `cliente_id=eq.${profile.id}`
                        },
                        (payload) => {
                            console.log("DEBUG: Order update detected via Realtime:", payload);
                            fetchOrders(); // Refresh the list when an update happens
                        }
                    )
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            } else {
                setLoading(false);
            }
        }
    }, [user?.id, profile?.id, authLoading, router]);

    const fetchOrders = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pedido')
                .select('*')
                .eq('cliente_id', profile.id)
                .order('data_pedido', { ascending: false });
            
            if (error) {
                console.error("Erro ao buscar pedidos:", JSON.stringify(error, null, 2));
                setOrders([]);
            } else {
                // Fetch items for these orders too
                const { data: itemsData } = await supabase
                    .from('item_pedido')
                    .select(`
                        *,
                        produto (
                            tituloMarketplace,
                            imgUrl
                        )
                    `)
                    .in('pedido_id', data?.map(o => o.id) || []);

                const ordersWithItems = data?.map(order => ({
                    ...order,
                    items: itemsData?.filter(i => i.pedido_id === order.id) || []
                }));

                setOrders(ordersWithItems || []);
            }
        } catch (err) {
            console.error("Erro inesperado ao buscar pedidos:", err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status: string) => {
        const s = (status || 'pendente').toLowerCase();
        switch (s) {
            case 'entregue': return { color: 'bg-green-600', label: 'Entregue', step: 4 };
            case 'enviado': return { color: 'bg-blue-600', label: 'Enviado', step: 3 };
            case 'em separação': case 'processando': return { color: 'bg-orange-500', label: 'Em Separação', step: 2 };
            case 'pago': case 'autorizado': return { color: 'bg-teal-600', label: 'Pagamento Confirmado', step: 1 };
            case 'pendente': case 'criado': return { color: 'bg-yellow-500', label: 'Aguardando Pagamento', step: 0 };
            case 'cancelado': return { color: 'bg-red-600', label: 'Cancelado', step: -1 };
            default: return { color: 'bg-gray-500', label: status, step: 0 };
        }
    };

    // We no longer return early here to avoid unmounting the background during focus changes
    // if (authLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container mx-auto py-10 px-4">
             <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
                <Package className="text-primary" /> Meus Pedidos
            </h1>

            {(loading || authLoading) && orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    <p className="text-muted-foreground animate-pulse">Sincronizando seus pedidos...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground border rounded-lg bg-muted/5 flex flex-col items-center">
                    <Package size={48} className="mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold">Nenhum pedido encontrado</h3>
                    <p className="max-w-xs mx-auto mt-2">Você ainda não fez nenhuma compra conosco. Aproveite nossas ofertas!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const statusInfo = getStatusInfo(order.status);
                        const isExpanded = selectedOrderId === order.id;

                        return (
                            <Card key={order.id} className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-primary shadow-xl scale-[1.01]' : 'hover:border-primary/50'}`}>
                                <div className="bg-muted/30 p-4 flex flex-wrap items-center justify-between gap-4 border-b">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-muted-foreground uppercase">Pedido #{order.id}</p>
                                        <div className="flex items-center gap-2 text-sm text-secondary">
                                            <Calendar size={14} />
                                            {new Date(order.data_pedido).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Total</p>
                                            <p className="font-bold text-primary">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total || 0)}
                                            </p>
                                        </div>
                                        <Badge className={`${statusInfo.color} text-white px-3 py-1`}>
                                            {statusInfo.label}
                                        </Badge>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setSelectedOrderId(isExpanded ? null : order.id)}
                                            className="text-primary hover:text-primary hover:bg-primary/10"
                                        >
                                            {isExpanded ? 'Ver Menos' : 'Ver Detalhes'}
                                        </Button>
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <CardContent className="p-6 animate-in slide-in-from-top-4 duration-300">
                                        {/* Status Timeline */}
                                        <div className="mb-8">
                                            <h4 className="text-sm font-semibold mb-6 flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                                                Acompanhamento do Pedido
                                            </h4>
                                            <div className="relative flex justify-between max-w-2xl mx-auto">
                                                {/* Line */}
                                                <div className="absolute top-4 left-0 right-0 h-1 bg-muted -z-0">
                                                    <div 
                                                        className="h-full bg-primary transition-all duration-1000" 
                                                        style={{ width: `${Math.max(0, (statusInfo.step / 4) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                
                                                {['Recebido', 'Pago', 'Separação', 'Enviado', 'Entregue'].map((label, idx) => {
                                                    const isActive = idx <= statusInfo.step;
                                                    return (
                                                        <div key={label} className="flex flex-col items-center gap-2 z-10">
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-4 transition-colors duration-500 ${isActive ? 'bg-primary border-primary-foreground text-white' : 'bg-muted border-white text-muted-foreground'}`}>
                                                                {idx < statusInfo.step ? <CheckCircle2 size={18} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                                                            </div>
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                                                {label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            {/* Products List */}
                                            <div className="space-y-4">
                                                <h4 className="text-sm font-semibold text-secondary flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 text-primary" /> Itens do Pedido
                                                </h4>
                                                <div className="border rounded-lg bg-muted/5 divide-y">
                                                    {order.items?.map((item: any) => (
                                                        <div key={item.id} className="p-3 flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded bg-white border flex items-center justify-center overflow-hidden shrink-0">
                                                                {item.produto?.imgUrl ? (
                                                                    <img src={item.produto.imgUrl} alt="" className="w-full h-full object-cover" />
                                                                ) : <Package className="text-muted-foreground/30" size={20} />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium line-clamp-1">{item.produto?.tituloMarketplace || 'Produto'}</p>
                                                                <p className="text-xs text-muted-foreground">{item.quantidade}x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_unitario)}</p>
                                                            </div>
                                                            <p className="text-sm font-bold">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_unitario * item.quantidade)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Delivery Info */}
                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-semibold text-secondary">Informações de Entrega</h4>
                                                    <div className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border border-dashed">
                                                        {order.endereco_entrega_snapshot ? (
                                                            <div className="space-y-1">
                                                                <p className="font-bold text-foreground">
                                                                    {order.endereco_entrega_snapshot.logradouro}, {order.endereco_entrega_snapshot.numero}
                                                                </p>
                                                                <p>{order.endereco_entrega_snapshot.bairro} - {order.endereco_entrega_snapshot.cidade}/{order.endereco_entrega_snapshot.estado}</p>
                                                                <p>CEP: {order.endereco_entrega_snapshot.cep}</p>
                                                            </div>
                                                        ) : <p>Endereço não disponível</p>}
                                                    </div>
                                                </div>

                                                {/* Tracking Code Section */}
                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-semibold text-secondary">Rastreamento</h4>
                                                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                                        {order.codigo_rastreio ? (
                                                            <div className="flex flex-col gap-2">
                                                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Código:</p>
                                                                <code className="text-lg font-mono font-bold text-primary bg-white px-2 py-1 rounded border self-start">
                                                                    {order.codigo_rastreio}
                                                                </code>
                                                                <Button variant="link" className="p-0 h-auto text-primary text-xs justify-start" onClick={() => window.open(`https://rastreamento.correios.com.br/app/index.php?codigo=${order.codigo_rastreio}`)}>
                                                                    Rastrear nos Correios ➔
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground italic">
                                                                {statusInfo.step >= 3 
                                                                    ? "O código de rastreio será disponibilizado em breve." 
                                                                    : "Aguardando envio para gerar código de rastreio."}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
