import { redirect } from "next/navigation";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q;
  if (q && q.trim()) {
    redirect(`/produtos?q=${encodeURIComponent(q.trim())}`);
  }
  redirect("/produtos");
}
