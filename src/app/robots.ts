import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/auth",
        "/auth/",
        "/api",
        "/api/",
        "/dashboard",
        "/dashboard/",
        "/mypage",
        "/mypage/",
        "/setting",
        "/setting/",
      ],
    },
    sitemap: getSiteUrl("/sitemap.xml"),
  };
}
