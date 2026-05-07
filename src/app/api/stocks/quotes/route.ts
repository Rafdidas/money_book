import { getKisDomesticQuote } from "@/lib/kis/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { symbols?: unknown };
    const symbols = Array.isArray(body.symbols)
      ? body.symbols
          .filter((symbol): symbol is string => typeof symbol === "string")
          .map((symbol) => symbol.trim())
          .filter((symbol) => /^\d{6}$/.test(symbol))
      : [];

    if (!symbols.length) {
      return Response.json({ quotes: [] });
    }

    const uniqueSymbols = [...new Set(symbols)];
    const quotes = [];

    for (const symbol of uniqueSymbols) {
      quotes.push(await getKisDomesticQuote(symbol));
    }

    return Response.json({ quotes });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : "현재가 조회에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
