import { FileText, ListChecks } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductDescriptionProps {
  description?: string | null;
}

type DescriptionBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "details"; items: Array<{ label: string; value: string }> }
  | { type: "list"; items: string[] };

const fallbackDescription =
  "Componente diesel profissional de alta durabilidade e precisão técnica. Todos os itens comercializados pela Demir Diesel passam por conferência dimensional e inspeção de integridade antes do envio.";

export function ProductDescription({ description }: ProductDescriptionProps) {
  const content = description?.trim() || fallbackDescription;
  const blocks = organizeDescription(content);

  return (
    <Card className="overflow-hidden shadow-lg shadow-slate-900/8 dark:shadow-black/25">
      <CardHeader className="bg-muted/30">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="size-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg">Descrição do item</CardTitle>
            <CardDescription>
              Detalhes, aplicações e informações fornecidas para este produto.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5 sm:p-6">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h3 key={`${block.type}-${index}`} className="text-sm font-bold text-foreground">
                {block.text}
              </h3>
            );
          }

          if (block.type === "details") {
            return (
              <dl
                key={`${block.type}-${index}`}
                className="grid gap-2 sm:grid-cols-2"
              >
                {block.items.map((item, itemIndex) => (
                  <div
                    key={`${item.label}-${itemIndex}`}
                    className="rounded-xl bg-muted/35 p-3.5 shadow-sm shadow-slate-900/5 dark:shadow-black/20"
                  >
                    <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </dt>
                    <dd className="text-sm font-medium leading-relaxed text-foreground">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            );
          }

          if (block.type === "list") {
            return (
              <div key={`${block.type}-${index}`} className="rounded-xl bg-muted/25 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ListChecks className="size-4 text-primary" />
                  Informações do produto
                </div>
                <ul className="space-y-2.5">
                  {block.items.map((item, itemIndex) => (
                    <li key={`${item}-${itemIndex}`} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          return (
            <p
              key={`${block.type}-${index}`}
              className="max-w-prose text-sm leading-7 text-muted-foreground"
            >
              {block.text}
            </p>
          );
        })}
      </CardContent>
    </Card>
  );
}

function organizeDescription(description: string): DescriptionBlock[] {
  const normalized = description
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*[;|]\s*/g, "\n")
    .trim();

  const lines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks: DescriptionBlock[] = [];
  let detailItems: Array<{ label: string; value: string }> = [];
  let listItems: string[] = [];

  const flushDetails = () => {
    if (detailItems.length > 0) {
      blocks.push({ type: "details", items: detailItems });
      detailItems = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  };

  for (const line of lines) {
    const bulletMatch = line.match(/^[\-*\u2022]\s*(.+)$/);
    if (bulletMatch) {
      flushDetails();
      listItems.push(bulletMatch[1]);
      continue;
    }

    const detailMatch = line.match(/^([^:]{2,40}):\s*(.+)$/);
    if (detailMatch) {
      flushList();
      detailItems.push({ label: detailMatch[1].trim(), value: detailMatch[2].trim() });
      continue;
    }

    flushDetails();
    flushList();

    if (line.endsWith(":") && line.length <= 70) {
      blocks.push({ type: "heading", text: line.slice(0, -1) });
      continue;
    }

    const sentences = line.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ü])/);
    if (sentences.length > 2) {
      for (let index = 0; index < sentences.length; index += 2) {
        blocks.push({ type: "paragraph", text: sentences.slice(index, index + 2).join(" ") });
      }
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }

  flushDetails();
  flushList();

  return blocks;
}
