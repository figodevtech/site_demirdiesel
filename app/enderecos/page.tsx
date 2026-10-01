"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  ArrowLeft,
  Building,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
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

export default function EnderecosPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/enderecos");
      } else if (profile?.id) {
        fetchAddresses();
      } else {
        setLoading(false);
      }
    }
  }, [user?.id, profile?.id, authLoading, router]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cliente_endereco")
        .select("*")
        .eq("cliente_id", profile.id)
        .order("id", { ascending: true });

      if (error) throw error;
      setAddresses(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar endereços.");
    } finally {
      setLoading(false);
    }
  };

  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setLogradouro(data.logradouro || "");
          setBairro(data.bairro || "");
          setCidade(data.localidade || "");
          setEstado(data.uf || "");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP", error);
      }
    }
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

  const handleEdit = (addr: any) => {
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
    if (!confirm("Tem certeza que deseja excluir este endereço?")) return;
    try {
      const { error } = await supabase.from("cliente_endereco").delete().eq("id", id);
      if (error) throw error;
      toast.success("Endereço removido.");
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir endereço.");
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
    <div className="container mx-auto max-w-5xl px-4 pb-8 pt-3 md:pb-10 md:pt-5">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-primary" />
            <span>Endereços de Entrega</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Cadastre os locais de entrega para agilizar suas compras
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="rounded-xl text-xs font-semibold h-9 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Endereço</span>
        </Button>
      </div>

      {loading || authLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Carregando seus endereços...</span>
        </div>
      ) : addresses.length === 0 ? (
        <div className="py-20 px-4 text-center rounded-3xl border border-dashed border-border/80 bg-slate-50/50 dark:bg-slate-900/30 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-border/60 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Building className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h2 className="text-base font-bold text-foreground">Nenhum endereço cadastrado</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-6">
            Adicione o endereço da sua oficina, frota ou residência para entrega das peças.
          </p>
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="rounded-xl px-6 font-semibold text-xs h-9"
          >
            Cadastrar Endereço
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex flex-col justify-between gap-4 rounded-2xl bg-card p-5 shadow-lg shadow-slate-900/8 dark:shadow-black/25"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-sm text-foreground leading-snug">
                    {addr.logradouro}, {addr.numero}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(addr)}
                      className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                      aria-label="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(addr.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      aria-label="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

      {/* Modal Dialog Adicionar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingId ? "Editar Endereço" : "Novo Endereço de Entrega"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs pt-2">
            <div>
              <Label className="text-xs">CEP*</Label>
              <Input
                placeholder="00000-000"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                onBlur={handleCepBlur}
                maxLength={9}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label className="text-xs">Logradouro / Rua*</Label>
                <Input
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Número*</Label>
                <Input
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Complemento</Label>
              <Input
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Ex: Galpão B, Sala 4"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Bairro*</Label>
                <Input
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Cidade*</Label>
                <Input
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Estado (UF)*</Label>
                <Input
                  value={estado}
                  maxLength={2}
                  onChange={(e) => setEstado(e.target.value.toUpperCase())}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="text-xs rounded-xl font-semibold"
            >
              {saving ? "Salvando..." : "Salvar Endereço"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
