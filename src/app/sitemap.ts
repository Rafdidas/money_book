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
      url: getSiteUrl("/analysis"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: {
        languages: {
          "ko-KR": getSiteUrl("/analysis"),
        },
      },
    },
    {
      url: getSiteUrl("/invest"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: {
        languages: {
          "ko-KR": getSiteUrl("/invest"),
        },
      },
    },
  ];
}
