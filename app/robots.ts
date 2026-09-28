import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url.replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/conta",
          "/pedidos",
          "/carrinho",
          "/checkout",
          "/enderecos",
          "/api/",
          "/sucesso",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
