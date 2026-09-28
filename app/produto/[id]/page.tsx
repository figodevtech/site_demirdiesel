import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Home, ChevronRight, Check, ShieldCheck, Truck, Wrench } from "lucide-react";
import { getProductById, getPaginatedProducts } from "@/lib/catalog/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductActions } from "@/components/product/ProductActions";
import { ProductCard } from "@/components/product/ProductCard";
import { Badge } from "@/components/ui/badge";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Produto não encontrado | Demir Diesel",
    };
  }

  const title = `${product.title} - ${product.brand} | Demir Diesel`;
  const description =
    product.description ||
    `Compre ${product.title} (${product.reference ? `Ref: ${product.reference}` : ""}) na Demir Diesel. Peças pesadas e módulos diesel com garantia e envio para todo o Brasil.`;

  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description: description.slice(0, 160),
      images: product.image ? [{ url: product.image }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  // Busca produtos relacionados da mesma categoria
  const relatedResult = product.categorySlug
    ? await getPaginatedProducts({ categorySlug: product.categorySlug, pageSize: 4 })
    : { products: [] };

  const relatedProducts = relatedResult.products.filter((p) => p.id !== product.id).slice(0, 4);

  // Schema.org JSON-LD estruturado
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images.length > 0 ? product.images : product.image ? [product.image] : undefined,
    description: product.description || product.title,
    sku: product.id,
    mpn: product.reference || undefined,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      price: product.price > 0 ? product.price : undefined,
      priceCurrency: "BRL",
      availability: product.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `https://erp.demirdiesel.com.br/produto/${product.slug || product.id}`,
    },
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 max-w-6xl">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 overflow-x-auto no-scrollbar pb-1">
        <Link href="/" className="hover:text-foreground flex items-center gap-1 shrink-0">
          <Home className="w-3.5 h-3.5" />
          <span>Início</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
        <Link href="/produtos" className="hover:text-foreground shrink-0">
          Catálogo
        </Link>
        {product.categoryName && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <Link
              href={`/produtos?category=${product.categorySlug}`}
              className="hover:text-foreground shrink-0 truncate max-w-[150px]"
            >
              {product.categoryName}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
        <span className="font-semibold text-foreground truncate max-w-[200px]">
          {product.title}
        </span>
      </nav>

      {/* Grid Principal do Produto */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
        {/* Lado Esquerdo: Galeria de Imagens */}
        <div className="md:col-span-6 lg:col-span-7">
          <ProductGallery
            images={product.images}
            productTitle={product.title}
            categoryName={product.categoryName}
          />
        </div>

        {/* Lado Direito: Informações Comerciais & Ações */}
        <div className="md:col-span-6 lg:col-span-5 space-y-6">
          {/* Header do Produto & Badges */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                {product.categoryName}
              </Badge>

              <Badge
                variant="outline"
                className="text-xs font-semibold px-2.5 py-0.5 border-primary/40 text-primary"
              >
                {product.brand}
              </Badge>

              {product.condition === "USADO" ? (
                <Badge className="text-xs font-bold px-2 py-0.5 bg-amber-500/10 text-amber-700 border border-amber-500/20">
                  USADO
                </Badge>
              ) : product.condition === "RECONDICIONADO" ? (
                <Badge className="text-xs font-bold px-2 py-0.5 bg-sky-500/10 text-sky-700 border border-sky-500/20">
                  RECONDICIONADO
                </Badge>
              ) : (
                <Badge className="text-xs font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                  NOVO / GENUÍNO
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
              {product.title}
            </h1>

            {/* Referência e Status de Estoque */}
            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <span className="font-mono text-muted-foreground">
                Cód: <strong className="text-foreground">#{product.id}</strong>
              </span>

              {product.reference && (
                <span className="font-mono text-muted-foreground">
                  Ref: <strong className="text-foreground">{product.reference}</strong>
                </span>
              )}

              {product.isAvailable ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  Disponível ({product.stock} un.)
                </span>
              ) : (
                <span className="text-slate-400 font-medium">
                  Sob Consulta / Encomenda
                </span>
              )}
            </div>
          </div>

          {/* Preço Comercial */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-border/80 space-y-1">
            {product.price > 0 ? (
              <>
                <span className="text-xs text-muted-foreground block font-medium">
                  Preço à vista
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {product.formattedPrice}
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Condições de faturamento e parcelamento no checkout.
                </p>
              </>
            ) : (
              <div>
                <span className="text-xl font-bold text-primary block">
                  Valor sob consulta técnica
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Consulte nossa equipe para cotação direta deste módulo ou componente.
                </p>
              </div>
            )}
          </div>

          {/* Ações (Adicionar ao carrinho, WhatsApp, simulação de frete) */}
          <ProductActions product={product} />

          {/* Selos de Confiança Técnica */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border/60">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">Garantia Técnica</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border/60">
              <Truck className="w-4 h-4 text-primary shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">Despacho Imediato</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ficha Técnica & Descrição do Produto */}
      <div className="border-t border-border/80 pt-10 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Especificações Técnicas</h2>
            <div className="rounded-2xl border border-border/80 divide-y divide-border/60 text-xs bg-card overflow-hidden">
              <div className="p-3 flex justify-between">
                <span className="text-muted-foreground">Código Interno</span>
                <span className="font-mono font-bold text-foreground">#{product.id}</span>
              </div>
              {product.reference && (
                <div className="p-3 flex justify-between">
                  <span className="text-muted-foreground">Referência / Part Number</span>
                  <span className="font-mono font-bold text-foreground">{product.reference}</span>
                </div>
              )}
              <div className="p-3 flex justify-between">
                <span className="text-muted-foreground">Fabricante</span>
                <span className="font-bold text-foreground">{product.brand}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-muted-foreground">Categoria</span>
                <span className="text-foreground">{product.categoryName}</span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-muted-foreground">Condição</span>
                <span className="font-semibold text-foreground">{product.condition}</span>
              </div>
              {product.barcode && (
                <div className="p-3 flex justify-between">
                  <span className="text-muted-foreground">Código de Barras</span>
                  <span className="font-mono text-foreground">{product.barcode}</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Descrição do Item</h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-card rounded-2xl border border-border/80 p-6">
              {product.description ||
                "Componente diesel profissional de alta durabilidade e precisão técnica. Todos os itens comercializados pela Demir Diesel passam por conferência dimensional e inspeção de integridade antes do envio."}
            </div>
          </div>
        </div>
      </div>

      {/* Produtos Relacionados */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-border/80 pt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              Peças Relacionadas em {product.categoryName}
            </h2>
            <Link
              href={`/produtos?category=${product.categorySlug}`}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Ver mais na categoria →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
