import { NextRequest, NextResponse } from "next/server";
import { quickSearch } from "@/lib/catalog/search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await quickSearch(q, 6);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Erro na API de busca:", err);
    return NextResponse.json({ error: "Falha na busca" }, { status: 500 });
  }
}
