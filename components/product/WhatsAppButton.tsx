"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppButtonProps {
  productTitle: string;
  reference?: string | null;
  productId?: string;
  phone?: string;
  variant?: "outline" | "default" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  label?: string;
}

export function WhatsAppButton({
  productTitle,
  reference,
  productId,
  phone = "5583999999999", // Contato WhatsApp da Demir Diesel
  variant = "outline",
  size = "default",
  className = "",
  label = "Falar com Especialista",
}: WhatsAppButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const refText = reference ? ` (Ref: ${reference})` : "";
    const codeText = productId ? ` [#${productId}]` : "";

    const message = encodeURIComponent(
      `Olá! Tenho interesse no item:\n*${productTitle}*${refText}${codeText}\n${currentUrl}\n\nGostaria de confirmar compatibilidade e disponibilidade.`
    );

    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, "")}?text=${message}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`font-medium transition-all gap-2 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-600/60 dark:text-emerald-400 dark:hover:bg-emerald-950/30 ${className}`}
    >
      <MessageCircle className="w-4 h-4 fill-emerald-600/20 text-emerald-600" />
      <span>{label}</span>
    </Button>
  );
}
