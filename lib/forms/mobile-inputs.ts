// Presets de atributos para campos de formulário: teclado certo, autocomplete e
// tecla "Enter" adequada em celulares. Uso: <Input {...mobileInput.cep} ... />

import type { InputHTMLAttributes } from "react";

type InputPreset = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "inputMode" | "autoComplete" | "autoCapitalize" | "autoCorrect" | "spellCheck" | "enterKeyHint" | "maxLength"
>;

export const mobileInput = {
  cep: { type: "text", inputMode: "numeric", autoComplete: "postal-code", enterKeyHint: "next", maxLength: 9 },
  street: { type: "text", autoComplete: "address-line1", autoCapitalize: "words", enterKeyHint: "next" },
  number: { type: "text", inputMode: "text", autoComplete: "address-line2", enterKeyHint: "next" },
  complement: { type: "text", autoComplete: "address-line3", autoCapitalize: "sentences", enterKeyHint: "next" },
  district: { type: "text", autoComplete: "address-level3", autoCapitalize: "words", enterKeyHint: "next" },
  city: { type: "text", autoComplete: "address-level2", autoCapitalize: "words", enterKeyHint: "next" },
  state: { type: "text", autoComplete: "address-level1", autoCapitalize: "characters", autoCorrect: "off", spellCheck: false, enterKeyHint: "done", maxLength: 2 },
  name: { type: "text", autoComplete: "name", autoCapitalize: "words", enterKeyHint: "next" },
  email: { type: "email", inputMode: "email", autoComplete: "email", autoCapitalize: "none", autoCorrect: "off", spellCheck: false, enterKeyHint: "next" },
  phone: { type: "tel", inputMode: "tel", autoComplete: "tel", enterKeyHint: "next" },
  document: { type: "text", inputMode: "numeric", autoComplete: "off", enterKeyHint: "next" },
  // Códigos e referências de peças: sem corretor/capitalização automática.
  search: { type: "search", inputMode: "search", autoComplete: "off", autoCapitalize: "none", autoCorrect: "off", spellCheck: false, enterKeyHint: "search" },
} satisfies Record<string, InputPreset>;

/** Formata "58081110" como "58081-110" enquanto o usuário digita. */
export function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function cepDigits(value: string) {
  return value.replace(/\D/g, "");
}
