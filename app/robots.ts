import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/conta", "/pedidos", "/carrinho", "/checkout", "/enderecos", "/api/"],
      },
    ],
    sitemap: "https://erp.demirdiesel.com.br/sitemap.xml",
  };
}
