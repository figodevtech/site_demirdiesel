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

function getSnapshot() {
  return window.matchMedia("(pointer: coarse)").matches && isTextEntry(document.activeElement)
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
  return () => {
    window.clearTimeout(timer)
    document.removeEventListener("focusin", callback)
    document.removeEventListener("focusout", deferred)
  }
}

/**
 * true enquanto um campo de texto está focado em dispositivo touch, ou seja,
 * quando o teclado virtual provavelmente está aberto. Usado para recolher barras fixas
 * inferiores (BottomNav, CTA do produto) e não cobrir o campo em edição.
 */
export function useVirtualKeyboardOpen() {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}
