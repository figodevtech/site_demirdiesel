"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildProductWhatsAppUrl } from "@/lib/site-config";

interface WhatsAppButtonProps {
  productTitle: string;
  reference?: string | null;
  productId?: string | number;
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
  label = "Consultar Especialista no WhatsApp",
}: WhatsAppButtonProps) {
  const targetUrl = buildProductWhatsAppUrl({
    title: productTitle,
    reference,
    id: productId,
  });

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={`font-medium transition-all gap-2 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-600/60 dark:text-emerald-400 dark:hover:bg-emerald-950/30 ${className}`}
    >
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
      >
        <MessageCircle className="w-4 h-4 fill-emerald-600/20 text-emerald-600" />
        <span>{label}</span>
      </a>
    </Button>
  );
}

export default WhatsAppButton;
