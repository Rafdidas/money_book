import { getFscDomesticStockQuote } from "@/lib/fsc/stock";
import { createClient } from "@/lib/supabase/server";
import type { StockQuote } from "@/types/stock";

export const runtime = "nodejs";
const MAX_QUOTE_SYMBOLS = 20;
const QUOTE_FETCH_CONCURRENCY = 5;
const QUOTE_CACHE_TTL = 1000 * 60 * 60 * 6;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_USER = 30;

type QuoteCacheEntry = {
  quote: StockQuote;
  expiresAt: number;
};

type QuoteFailure = {
  symbol: string;
  message: string;
};

const quoteCache = new Map<string, QuoteCacheEntry>();
const pendingQuoteRequests = new Map<string, Promise<StockQuote>>();

const getCachedDomesticStockQuote = async (symbol: string) => {
  const now = Date.now();
  const cached = quoteCache.get(symbol);

  if (cached?.expiresAt && cached.expiresAt > now) {
    return cached.quote;
  }

  const pending = pendingQuoteRequests.get(symbol);
  if (pending) return pending;

  const quoteRequest = getFscDomesticStockQuote(symbol)
    .then((quote) => {
      quoteCache.set(symbol, {
        quote,
        expiresAt: Date.now() + QUOTE_CACHE_TTL,
      });
      return quote;
    })
    .finally(() => {
      pendingQuoteRequests.delete(symbol);
    });

  pendingQuoteRequests.set(symbol, quoteRequest);
  return quoteRequest;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { message: "로그인이 필요한 요청입니다." },
        { status: 401 },
      );
    }

    const { data: rateLimitRows, error: rateLimitError } = await supabase.rpc(
      "take_stock_quote_rate_limit",
      {
        max_requests: MAX_REQUESTS_PER_USER,
        window_seconds: RATE_LIMIT_WINDOW_SECONDS,
      },
    );

    if (rateLimitError) {
      throw new Error(`종가 조회 요청 제한을 확인하지 못했습니다: ${rateLimitError.message}`);
    }

    const rateLimit = Array.isArray(rateLimitRows) ? rateLimitRows[0] : rateLimitRows;
    if (!rateLimit?.is_allowed) {
      return Response.json(
        { message: "최근 종가 업데이트 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit?.retry_after || 1) },
        },
      );
    }

    const body = (await request.json()) as { symbols?: unknown };
    const symbols = Array.isArray(body.symbols)
      ? body.symbols
          .filter((symbol): symbol is string => typeof symbol === "string")
          .map((symbol) => symbol.trim().toUpperCase())
          .filter((symbol) => /^[0-9A-Z]{6}$/.test(symbol))
      : [];

    if (!symbols.length) {
      return Response.json({ quotes: [] });
    }

    const uniqueSymbols = [...new Set(symbols)];

    if (uniqueSymbols.length > MAX_QUOTE_SYMBOLS) {
      return Response.json(
        { message: `최근 종가는 한 번에 ${MAX_QUOTE_SYMBOLS}개 종목까지 조회할 수 있습니다.` },
        { status: 400 },
      );
    }

    const quotes: StockQuote[] = [];
    const failures: QuoteFailure[] = [];

    for (let index = 0; index < uniqueSymbols.length; index += QUOTE_FETCH_CONCURRENCY) {
      const batch = uniqueSymbols.slice(index, index + QUOTE_FETCH_CONCURRENCY);
      const results = await Promise.allSettled(batch.map(getCachedDomesticStockQuote));

      results.forEach((result, resultIndex) => {
        if (result.status === "fulfilled") {
          quotes.push(result.value);
          return;
        }

        failures.push({
          symbol: batch[resultIndex],
          message:
            result.reason instanceof Error
              ? result.reason.message
              : "최근 종가 조회에 실패했습니다.",
        });
      });
    }

    if (!quotes.length && failures.length) {
      return Response.json(
        { message: failures[0].message, failures },
        { status: 502 },
      );
    }

    return Response.json({ quotes, failures });
  } catch (error) {
    console.error("stock-quotes-failed", error);
    return Response.json(
      { message: "잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
