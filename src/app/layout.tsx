import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import Providers from "./providers";
import "./globals.scss";

export const metadata: Metadata = {
  title: "money book",
  description: "Track your income and expenses with money book",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="app-body">
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <Providers>
            <Header />
            <main className="app-main">{children}</main>
            <Footer />
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
