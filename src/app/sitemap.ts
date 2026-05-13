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
  ];
}
