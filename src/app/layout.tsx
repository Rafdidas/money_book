import "@mantine/core/styles.css";
import type { Metadata } from "next";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
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
    <html lang="ko" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className="app-body">
        <Providers>
          <Header />
          <main className="app-main">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
