"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Building,
} from "lucide-react";
import { AccountSectionHeader, AccountShell } from "@/components/account/AccountShell";
import { ListSkeleton } from "@/components/feedback/Skeletons";
import { cepDigits, formatCep, mobileInput } from "@/lib/forms/mobile-inputs";
import { useAuth } from "@/components/providers/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CustomerAddress {
  id: number;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
}

export default function EnderecosPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<CustomerAddress | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cliente_endereco")
        .select("*")
        .eq("cliente_id", profile.id)
        .order("id", { ascending: true });

      if (error) throw error;
      setAddresses((data || []) as CustomerAddress[]);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar endereços.");
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/enderecos");
    } else if (profile?.id) {
      void fetchAddresses();
    } else {
      setLoading(false);
    }
  }, [authLoading, fetchAddresses, profile?.id, router, user]);

  // Preenche o endereço assim que o CEP tem 8 dígitos e foca o "Número".
  const lookupCep = async (cleanCep: string) => {
    if (cleanCep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setLogradouro(data.logradouro || "");
        setBairro(data.bairro || "");
        setCidade(data.localidade || "");
        setEstado(data.uf || "");
        if (data.logradouro) document.getElementById("address-number")?.focus();
      } else {
        toast.warning("CEP não encontrado. Preencha o endereço manualmente.");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP", error);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    if (cepDigits(formatted).length === 8 && cepDigits(cep).length !== 8) void lookupCep(cepDigits(formatted));
    setCep(formatted);
  };

  const resetForm = () => {
    setEditingId(null);
    setCep("");
    setLogradouro("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setEstado("");
  };

  const handleEdit = (addr: CustomerAddress) => {
    setEditingId(addr.id);
    setCep(addr.cep);
    setLogradouro(addr.logradouro);
    setNumero(addr.numero);
    setComplemento(addr.complemento || "");
    setBairro(addr.bairro);
    setCidade(addr.cidade);
    setEstado(addr.estado);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("cliente_endereco").delete().eq("id", id);
      if (error) throw error;
      toast.success("Endereço removido.");
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir endereço.");
    } finally {
      setAddressToDelete(null);
    }
  };

  const handleSave = async () => {
    if (!cep || !logradouro || !numero || !bairro || !cidade || !estado) {
      toast.warning("Preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        cliente_id: profile.id,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      };

      if (editingId) {
        const { error } = await supabase
          .from("cliente_endereco")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Endereço atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("cliente_endereco").insert(payload);
        if (error) throw error;
        toast.success("Endereço adicionado com sucesso!");
      }

      setIsDialogOpen(false);
      resetForm();
      await fetchAddresses();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar endereço.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountShell>
      <AccountSectionHeader
        icon={MapPin}
        title="Endereços de entrega"
        description="Cadastre os locais de entrega para agilizar suas compras."
        action={
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="h-10 w-full gap-2 font-semibold sm:w-auto"
        >
          <Plus className="size-4" />
          <span>Novo endereço</span>
        </Button>
        }
      />

      <Card className="min-h-[32rem] border-0 py-0 shadow-lg shadow-slate-900/8 dark:shadow-black/25">
        <CardContent className="p-5 sm:p-6">
        {loading || authLoading ? (
        <ListSkeleton rows={2} />
      ) : addresses.length === 0 ? (
        <div className="flex min-h-96 flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building className="size-7 stroke-[1.5]" />
          </div>
          <h2 className="text-base font-bold text-foreground">Nenhum endereço cadastrado</h2>
          <p className="mb-6 mt-2 max-w-md text-sm text-muted-foreground">
            Adicione o endereço da sua oficina, frota ou residência para entrega das peças.
          </p>
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="h-10 gap-2 px-6 font-semibold"
          >
            <Plus className="size-4" />
            Cadastrar endereço
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex min-h-40 flex-col justify-between gap-4 rounded-2xl bg-muted/35 p-5 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-sm text-foreground leading-snug">
                    {addr.logradouro}, {addr.numero}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(addr)}
                      className="size-8 text-muted-foreground hover:text-primary"
                      aria-label="Editar endereço"
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setAddressToDelete(addr)}
                      className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Excluir endereço"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {addr.complemento && (
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {addr.complemento}
                  </span>
                )}

                <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                  <p>
                    {addr.bairro} • {addr.cidade} - {addr.estado}
                  </p>
                  <p className="font-mono text-slate-500">CEP: {addr.cep}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </CardContent>
      </Card>

      {/* Modal Dialog Adicionar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent mobileSheet className="sm:max-w-md sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingId ? "Editar Endereço" : "Novo Endereço de Entrega"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs pt-2">
            <div>
              <Label className="text-xs">CEP*</Label>
              <Input
                {...mobileInput.cep}
                placeholder="00000-000"
                value={cep}
                onChange={(e) => handleCepChange(e.target.value)}
                className="h-11 text-sm font-mono tracking-wide"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label className="text-xs">Logradouro / Rua*</Label>
                <Input
                  {...mobileInput.street}
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="h-11 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Número*</Label>
                <Input
                  id="address-number"
                  {...mobileInput.number}
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="h-11 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Complemento</Label>
              <Input
                {...mobileInput.complement}
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Ex: Galpão B, Sala 4"
                className="h-11 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs">Bairro*</Label>
                <Input
                  {...mobileInput.district}
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="h-11 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Cidade*</Label>
                <Input
                  {...mobileInput.city}
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="h-11 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Estado (UF)*</Label>
                <Input
                  {...mobileInput.state}
                  value={estado}
                  onChange={(e) => setEstado(e.target.value.toUpperCase())}
                  className="h-11 text-sm uppercase"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="h-11 text-sm rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-12 text-sm rounded-xl font-semibold sm:h-11"
            >
              {saving ? "Salvando..." : "Salvar Endereço"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(addressToDelete)}
        onOpenChange={(open) => {
          if (!open) setAddressToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir endereço?</AlertDialogTitle>
            <AlertDialogDescription>
              {addressToDelete
                ? `${addressToDelete.logradouro}, ${addressToDelete.numero} será removido da sua conta.`
                : "Este endereço será removido da sua conta."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (addressToDelete) void handleDelete(addressToDelete.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AccountShell>
  );
}
