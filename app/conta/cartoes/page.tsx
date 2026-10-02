"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, LockKeyhole, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AccountSectionHeader, AccountShell } from "@/components/account/AccountShell";
import { useAuth } from "@/components/providers/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SavedCard {
  id: string;
  brand: string;
  lastFour: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}

export default function SavedCardsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cardToRemove, setCardToRemove] = useState<SavedCard | null>(null);
  const [saving, setSaving] = useState(false);
  const [holderName, setHolderName] = useState("");
  const [number, setNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [ccv, setCcv] = useState("");

  const loadCards = useCallback(async () => {
    if (!user) return;
    setLoadingCards(true);
    try {
      const response = await fetch("/api/account/cards", { cache: "no-store" });
      const data = (await response.json()) as { cards?: SavedCard[]; message?: string };
      if (!response.ok) throw new Error(data.message || "Erro ao carregar cartões.");
      setCards(data.cards || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar cartões.");
    } finally {
      setLoadingCards(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?redirect=/conta/cartoes");
    else if (user) void loadCards();
  }, [isLoading, loadCards, router, user]);

  function resetForm() {
    setHolderName("");
    setNumber("");
    setExpiryMonth("");
    setExpiryYear("");
    setCcv("");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/account/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holderName, number, expiryMonth, expiryYear, ccv }),
      });
      const data = (await response.json()) as { card?: SavedCard; message?: string };
      if (!response.ok || !data.card) throw new Error(data.message || "Não foi possível salvar o cartão.");
      setCards((current) => [data.card!, ...current]);
      resetForm();
      setDialogOpen(false);
      toast.success("Cartão adicionado com segurança.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o cartão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!cardToRemove) return;
    try {
      const response = await fetch("/api/account/cards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: cardToRemove.id }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message || "Não foi possível remover o cartão.");
      setCards((current) => current.filter((card) => card.id !== cardToRemove.id));
      toast.success("Cartão removido.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o cartão.");
    } finally {
      setCardToRemove(null);
    }
  }

  if (isLoading || !user) {
    return <div className="flex flex-col items-center justify-center gap-3 py-24 text-center"><Loader2 className="size-6 animate-spin text-primary" /><span className="text-xs text-muted-foreground">Carregando formas de pagamento...</span></div>;
  }

  return (
    <AccountShell>
      <AccountSectionHeader
        icon={CreditCard}
        title="Cartões salvos"
        description="Gerencie cartões tokenizados para compras futuras."
        action={<Button onClick={() => setDialogOpen(true)} className="h-10 w-full gap-2 font-semibold sm:w-auto"><Plus className="size-4" />Novo cartão</Button>}
      />

      <Alert className="mb-4 border-0 bg-primary/[0.07] text-foreground shadow-sm">
        <ShieldCheck className="size-4 text-primary" />
        <AlertTitle>Pagamento protegido pelo Asaas</AlertTitle>
        <AlertDescription>Guardamos somente um token seguro e os quatro últimos dígitos. Número completo e CVV não ficam no banco da loja.</AlertDescription>
      </Alert>

      <Card className="min-h-[27rem] border-0 py-0 shadow-lg shadow-slate-900/8 dark:shadow-black/25">
        <CardContent className="p-5 sm:p-6">
          {loadingCards ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3"><Loader2 className="size-6 animate-spin text-primary" /><span className="text-xs text-muted-foreground">Carregando cartões...</span></div>
          ) : cards.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-4 text-center">
              <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><LockKeyhole className="size-7" /></span>
              <h3 className="text-base font-bold text-foreground">Nenhum cartão salvo</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Cadastre um cartão para agilizar as próximas compras. É necessário ter pelo menos um endereço cadastrado.</p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => setDialogOpen(true)} className="gap-2 font-semibold"><Plus className="size-4" />Adicionar cartão</Button>
                <Button asChild variant="outline"><Link href="/enderecos">Cadastrar endereço</Link></Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {cards.map((card) => (
                <div key={card.id} className="relative min-h-48 overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-md">
                  <div className="absolute -right-12 -top-12 size-36 rounded-full bg-primary-foreground/10" />
                  <div className="relative flex h-full flex-col justify-between gap-8">
                    <div className="flex items-start justify-between"><CreditCard className="size-7" /><div className="flex items-center gap-2">{card.isDefault ? <Badge className="border-0 bg-primary-foreground/15 text-primary-foreground">Principal</Badge> : null}<Button variant="ghost" size="icon" onClick={() => setCardToRemove(card)} className="size-8 text-primary-foreground/75 hover:bg-primary-foreground/15 hover:text-primary-foreground" aria-label="Remover cartão"><Trash2 className="size-4" /></Button></div></div>
                    <div><p className="font-mono text-lg font-semibold tracking-[0.2em]">•••• •••• •••• {card.lastFour}</p><div className="mt-4 flex items-end justify-between gap-4 text-xs"><div><span className="block text-[9px] uppercase text-primary-foreground/60">Titular</span><strong className="uppercase">{card.holderName}</strong></div><div className="text-right"><span className="block text-[9px] uppercase text-primary-foreground/60">Validade</span><strong>{card.expiryMonth}/{card.expiryYear.slice(-2)}</strong></div><strong>{card.brand}</strong></div></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="border-0 sm:max-w-lg">
          <DialogHeader><DialogTitle>Adicionar cartão</DialogTitle><DialogDescription>Os dados serão enviados ao Asaas para tokenização segura.</DialogDescription></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="card-holder">Nome impresso no cartão</Label><Input id="card-holder" value={holderName} onChange={(event) => setHolderName(event.target.value.toUpperCase())} autoComplete="cc-name" required /></div>
            <div className="space-y-2"><Label htmlFor="card-number">Número do cartão</Label><Input id="card-number" value={number} onChange={(event) => setNumber(formatCardNumber(event.target.value))} inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" required /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label htmlFor="card-month">Mês</Label><Input id="card-month" value={expiryMonth} onChange={(event) => setExpiryMonth(event.target.value.replace(/\D/g, "").slice(0, 2))} inputMode="numeric" autoComplete="cc-exp-month" placeholder="MM" required /></div>
              <div className="space-y-2"><Label htmlFor="card-year">Ano</Label><Input id="card-year" value={expiryYear} onChange={(event) => setExpiryYear(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" autoComplete="cc-exp-year" placeholder="AAAA" required /></div>
              <div className="space-y-2"><Label htmlFor="card-ccv">CVV</Label><Input id="card-ccv" type="password" value={ccv} onChange={(event) => setCcv(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" autoComplete="cc-csc" placeholder="•••" required /></div>
            </div>
            <DialogFooter className="pt-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving} className="gap-2 font-semibold">{saving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}{saving ? "Tokenizando..." : "Salvar cartão"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(cardToRemove)} onOpenChange={(open) => { if (!open) setCardToRemove(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remover cartão?</AlertDialogTitle><AlertDialogDescription>O cartão terminado em {cardToRemove?.lastFour} deixará de aparecer nesta conta.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void handleRemove()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </AccountShell>
  );
}
