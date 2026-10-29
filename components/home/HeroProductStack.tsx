"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCardPaymentTerms } from "@/components/product/ProductCardPaymentTerms";
import { ProductFallbackImage } from "@/components/product/ProductFallbackImage";
import type { PublicProduct } from "@/lib/catalog/types";
import styles from "./HeroProductCard.module.css";

export function HeroProductStack({ products }: { products: PublicProduct[] }) {
  const cards: (PublicProduct | undefined)[] = products.length ? products.slice(0, 3) : [undefined];
  const [activeId, setActiveId] = useState(products[0]?.id ?? "catalog");
  const links = useRef(new Map<string, HTMLAnchorElement>());
  const activeIndex = Math.max(0, cards.findIndex((product) => (product?.id ?? "catalog") === activeId));

  function activate(id: string, keyboard: boolean) {
    setActiveId(id);
    if (keyboard) {
      requestAnimationFrame(() => links.current.get(id)?.focus({ preventScroll: true }));
    }
  }

  return (
    <div className={styles.scene} role="group" aria-label="Produtos em destaque">
      <div className={styles.floating}>
        <div className={styles.deck}>
          {cards.map((product, index) => {
            const id = product?.id ?? "catalog";
            const position = (index - activeIndex + cards.length) % cards.length;
            const active = position === 0;
            const href = product ? "/produto/" + (product.slug || product.id) : "/produtos";

            return (
              <div className={styles.slot} data-position={position} data-active={active} key={id}>
                <div className={styles.tilt}>
                  <Link
                    ref={(element) => {
                      if (element) links.current.set(id, element);
                      else links.current.delete(id);
                    }}
                    className={`${styles.surface} relative grid grid-cols-1 rounded-2xl text-slate-950`}
                    href={href}
                    tabIndex={active ? 0 : -1}
                    aria-hidden={active ? undefined : true}
                  >
                    <div className={`${styles.media} relative h-44 md:h-48`}>
                      <div className={`${product?.image ? styles.image : ""} absolute inset-0`}>
                        {product?.image ? (
                          <Image
                            alt={product.title}
                            className="object-cover"
                            fill
                            priority={index === 0}
                            sizes="(max-width: 767px) 280px, (max-width: 1023px) 240px, 312px"
                            src={product.image}
                          />
                        ) : (
                          <ProductFallbackImage category={product?.categoryName} className="rounded-t-2xl" />
                        )}
                      </div>
                      <span className={`${styles.badge} absolute left-3 top-3 rounded-full bg-emerald-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white`}>
                        Em estoque
                      </span>
                    </div>
                    <div className={`${styles.content} flex min-w-0 flex-col justify-center p-4`}>
                      <p className={`${styles.text} text-[10px] font-bold uppercase tracking-[0.16em] text-primary`}>
                        Destaque da loja
                      </p>
                      <h2 className={`${styles.text} mt-2 line-clamp-2 text-sm font-bold leading-snug sm:text-base`}>
                        {product?.title || "Confira nosso catálogo completo"}
                      </h2>
                      {product?.reference ? (
                        <p className={`${styles.text} mt-1 truncate font-mono text-[10px] text-slate-500`}>
                          Ref. {product.reference}
                        </p>
                      ) : null}
                      <p className={`${styles.text} mt-3 text-lg font-black text-slate-950 sm:text-xl`}>
                        {product?.price ? product.formattedPrice : "Ver produtos"}
                      </p>
                      {product&&product.price>0&&<ProductCardPaymentTerms productId={Number(product.id)} price={product.price} initialQuote={product.cardPaymentTerms}/>}
                      <span className={`${styles.cta} mt-3 text-xs font-bold`}>
                        <span className={styles.ctaLabel}>Ver produto</span>
                        <ArrowRight className="relative z-10 size-3.5 shrink-0" />
                      </span>
                    </div>
                  </Link>
                  {!active ? (
                    <button
                      type="button"
                      className={styles.activate}
                      aria-label={`Colocar ${product?.title ?? "catálogo"} em destaque`}
                      onClick={(event) => activate(id, event.detail === 0)}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Produto em destaque: {cards[activeIndex]?.title ?? "Catálogo completo"}
      </p>
    </div>
  );
}
