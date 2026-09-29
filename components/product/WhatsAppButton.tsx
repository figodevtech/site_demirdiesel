"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildProductWhatsAppUrl } from "@/lib/site-config";

interface WhatsAppButtonProps {
  productTitle: string;
  reference?: string | null;
  productId?: string | number;
  action?: "interesse" | "valor" | "disponibilidade";
  variant?: "outline" | "default" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  label?: string;
}

export function WhatsAppButton({
  productTitle,
  reference,
  productId,
  action,
  variant = "outline",
  size = "default",
  className = "",
  label = "Consultar Especialista",
}: WhatsAppButtonProps) {
  const targetUrl = buildProductWhatsAppUrl({
    title: productTitle,
    reference,
    id: productId,
    action,
  });

  const baseStyles =
    variant === "default"
      ? "bg-primary text-white hover:bg-primary/90 shadow-xs font-semibold"
      : "border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-600/60 dark:text-emerald-400 dark:hover:bg-emerald-950/30 font-medium";

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={`transition-all gap-2 ${baseStyles} ${className}`}
    >
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
      >
        <MessageCircle className={`w-4 h-4 shrink-0 ${variant === "default" ? "text-white" : "fill-emerald-600/20 text-emerald-600"}`} />
        <span>{label}</span>
      </a>
    </Button>
  );
}

export default WhatsAppButton;
