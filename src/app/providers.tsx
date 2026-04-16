"use client";

import { MantineProvider, createTheme } from "@mantine/core";

const theme = createTheme({
  fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  defaultRadius: "md",
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
}
