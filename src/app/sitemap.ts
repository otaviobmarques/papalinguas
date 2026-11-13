import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date();
  return [
    { url: `${SITE.url}/`, lastModified: agora, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/comecar`, lastModified: agora, changeFrequency: "monthly", priority: 0.8 },
    ...["termos", "privacidade", "cookies", "reembolso"].map((d) => ({ url: `${SITE.url}/legal/${d}`, lastModified: agora, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
