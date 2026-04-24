import type { Metadata } from "next";
import Header from "@/components/common/Header";
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
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      <body className="app-body">
        <div className="wrapper">
          <Header />
          <main className="app-main">{children}</main>
          {/* <Footer /> */}
        </div>
      </body>
    </html>
  );
}
