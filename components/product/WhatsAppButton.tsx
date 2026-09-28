"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig, buildWhatsAppUrl } from "@/lib/site-config";
import { useRouter } from "next/navigation";

interface WhatsAppButtonProps {
  productTitle: string;
  reference?: string | null;
  productId?: string;
  variant?: "outline" | "default" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  label?: string;
}

export function WhatsAppButton({
  productTitle,
  reference,
  productId,
  variant = "outline",
  size = "default",
  className = "",
  label = "Falar com Especialista",
}: WhatsAppButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const refText = reference ? ` (Ref: ${reference})` : "";
    const codeText = productId ? ` [#${productId}]` : "";

    const message = `Olá! Tenho interesse no item:\n*${productTitle}*${refText}${codeText}\n${currentUrl}\n\nGostaria de confirmar compatibilidade e disponibilidade.`;

    const targetUrl = buildWhatsAppUrl(message);

    if (targetUrl.startsWith("http")) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } else {
      router.push(targetUrl);
    }
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
