import * as React from "react"

const NON_TEXT_INPUTS = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
])

function isTextEntry(element: Element | null) {
  if (!(element instanceof HTMLElement)) return false
  if (element.isContentEditable || element.tagName === "TEXTAREA") return true
  return element instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(element.type)
}

// Altura mínima "roubada" da tela para considerar que o teclado está visível.
const KEYBOARD_MIN_HEIGHT = 120

function getSnapshot() {
  if (!window.matchMedia("(pointer: coarse)").matches || !isTextEntry(document.activeElement)) return false
  const viewport = window.visualViewport
  // Sem visualViewport (navegadores antigos): campo focado já basta.
  if (!viewport) return true
  // Foco programático sem teclado (ex.: autofocus no iOS) não esconde as barras.
  return document.documentElement.clientHeight - viewport.height > KEYBOARD_MIN_HEIGHT
}

function subscribe(callback: () => void) {
  // No focusout o próximo campo ainda não recebeu foco; aguardamos para não "piscar" a barra.
  let timer: number | undefined
  const deferred = () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(callback, 50)
  }
  document.addEventListener("focusin", callback)
  document.addEventListener("focusout", deferred)
  window.visualViewport?.addEventListener("resize", callback)
  return () => {
    window.clearTimeout(timer)
    document.removeEventListener("focusin", callback)
    document.removeEventListener("focusout", deferred)
    window.visualViewport?.removeEventListener("resize", callback)
  }
}

/**
 * true enquanto o teclado virtual está aberto (campo de texto focado em tela touch e a
 * viewport visual reduzida pelo teclado). Usado para recolher barras fixas
 * inferiores (BottomNav, CTA do produto) e não cobrir o campo em edição.
 */
export function useVirtualKeyboardOpen() {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}
