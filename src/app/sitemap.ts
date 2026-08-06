import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const lastModified = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: getSiteUrl(),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          "ko-KR": getSiteUrl(),
        },
      },
    },
    {
      url: getSiteUrl("/legal/terms"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: getSiteUrl("/legal/privacy"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
