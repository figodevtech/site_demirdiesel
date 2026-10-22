import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const categorySchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullish(),
  active: z.boolean().default(true),
});

const imageSchema = z.object({
  url: z.string().url().max(2000),
  path: z.string().trim().max(1000).optional(),
  order: z.coerce.number().int().min(0).default(0),
});

const productSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(300),
  marketplaceTitle: z.string().trim().max(300).nullish(),
  marketplaceDescription: z.string().trim().max(10000).nullish(),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  reference: z.string().trim().max(200).nullish(),
  manufacturer: z.string().trim().max(200).nullish(),
  categoryId: z.coerce.number().int().positive().nullish(),
  imageUrl: z.string().url().max(2000).nullish(),
  condition: z.enum(["NOVO", "USADO", "RECONDICIONADO"]).nullish(),
  featured: z.boolean().default(false),
  visible: z.boolean().default(true),
  deleted: z.boolean().default(false),
  barcode: z.string().trim().max(100).nullish(),
  updatedAt: z.string().datetime({ offset: true }).nullish(),
  images: z.array(imageSchema).max(30).default([]),
});

const payloadSchema = z.object({
  categories: z.array(categorySchema).max(500).default([]),
  products: z.array(productSchema).max(500).default([]),
}).refine(payload => payload.categories.length > 0 || payload.products.length > 0, { message: "Envie categorias ou produtos." });

function safeEqual(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.ERP_CATALOG_SYNC_SECRET?.trim();
  if (!expected) return false;

  const authorization = request.headers.get("authorization") || "";
  const received = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : request.headers.get("x-erp-sync-secret")?.trim() || "";

  return Boolean(received) && safeEqual(received, expected);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
  }

  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "PAYLOAD_INVALIDO", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const { categories, products } = parsed.data;

  if (categories.length > 0) {
    const { error } = await supabaseAdmin.from("produtogrupo").upsert(
      categories.map((category) => ({
        id: category.id,
        nome: category.name,
        descricao: category.description || null,
        ativo: category.active,
        updatedat: now,
      })),
      { onConflict: "id" }
    );

    if (error) {
      console.error("[erp/catalog] Falha ao sincronizar categorias:", error);
      return NextResponse.json({ error: "ERRO_CATEGORIAS" }, { status: 500 });
    }
  }

  if (products.length > 0) {
  const { error: productsError } = await supabaseAdmin.from("produto").upsert(
    products.map((product) => ({
      id: product.id,
      titulo: product.title,
      tituloMarketplace: product.marketplaceTitle || product.title,
      descricaoMarketplace: product.marketplaceDescription || "",
      precovenda: product.price,
      estoque: product.stock,
      referencia: product.reference || null,
      fabricante: product.manufacturer || null,
      grupo_produto_id: product.categoryId || null,
      imgUrl: product.imageUrl || null,
      conservacao: product.condition || null,
      destaque: product.featured,
      visible: product.visible,
      is_deleted: product.deleted,
      codigobarras: product.barcode || null,
      erp_updated_at: product.updatedAt || null,
      synced_at: now,
    })),
    { onConflict: "id" }
  );

  if (productsError) {
    console.error("[erp/catalog] Falha ao sincronizar produtos:", productsError);
    return NextResponse.json({ error: "ERRO_PRODUTOS" }, { status: 500 });
  }

  }
  const syncedProductIds = products.map((product) => product.id);

  if (syncedProductIds.length > 0) {
    const { error: deleteImagesError } = await supabaseAdmin
      .from("produto_imagem")
      .delete()
      .in("produto_id", syncedProductIds);

    if (deleteImagesError) {
      console.error("[erp/catalog] Falha ao substituir imagens:", deleteImagesError);
      return NextResponse.json({ error: "ERRO_IMAGENS" }, { status: 500 });
    }

    const images = products.flatMap((product) =>
      product.images.map((image) => ({
        produto_id: product.id,
        url: image.url,
        path: image.path || image.url,
        ordem: image.order,
      }))
    );

    if (images.length > 0) {
      const { error: imagesError } = await supabaseAdmin
        .from("produto_imagem")
        .insert(images);

      if (imagesError) {
        console.error("[erp/catalog] Falha ao gravar imagens:", imagesError);
        return NextResponse.json({ error: "ERRO_IMAGENS" }, { status: 500 });
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/produto/[id]", "page");
  revalidatePath("/categoria/[slug]", "page");

  return NextResponse.json({
    ok: true,
    syncedAt: now,
    categories: categories.length,
    products: products.length,
  });
}
