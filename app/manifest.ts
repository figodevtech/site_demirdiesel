import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Demir Diesel - Peças & Tecnologia",
    short_name: "Demir Diesel",
    description: "Catálogo de peças pesadas, módulos eletrônicos e injeção diesel.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: "#0A7AAC",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
