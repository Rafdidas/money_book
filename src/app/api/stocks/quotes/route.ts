import { getFscDomesticStockQuote } from "@/lib/fsc/stock";
import { createClient } from "@/lib/supabase/server";
import type { StockQuote } from "@/types/stock";

export const runtime = "nodejs";
const MAX_QUOTE_SYMBOLS = 20;
const QUOTE_CACHE_TTL = 1000 * 60 * 60 * 6;
const RATE_LIMIT_WINDOW = 1000 * 60;
const MAX_REQUESTS_PER_USER = 5;

type QuoteCacheEntry = {
  quote: StockQuote;
  expiresAt: number;
};

type RateLimitEntry = {
  count: number;
  resetsAt: number;
};

type QuoteFailure = {
  symbol: string;
  message: string;
};

const quoteCache = new Map<string, QuoteCacheEntry>();
const pendingQuoteRequests = new Map<string, Promise<StockQuote>>();
const userRateLimit = new Map<string, RateLimitEntry>();
let lastRateLimitCleanup = 0;

const takeRateLimit = (userId: string) => {
  const now = Date.now();

  if (lastRateLimitCleanup + RATE_LIMIT_WINDOW <= now) {
    userRateLimit.forEach((entry, key) => {
      if (entry.resetsAt <= now) userRateLimit.delete(key);
    });
    lastRateLimitCleanup = now;
  }

  const current = userRateLimit.get(userId);

  if (!current || current.resetsAt <= now) {
    userRateLimit.set(userId, { count: 1, resetsAt: now + RATE_LIMIT_WINDOW });
    return { isAllowed: true, retryAfter: 0 };
  }

  if (current.count >= MAX_REQUESTS_PER_USER) {
    return {
      isAllowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetsAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { isAllowed: true, retryAfter: 0 };
};

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

    const rateLimit = takeRateLimit(user.id);
    if (!rateLimit.isAllowed) {
      return Response.json(
        { message: "최근 종가 업데이트 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        },
      );
    }

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

    if (uniqueSymbols.length > MAX_QUOTE_SYMBOLS) {
      return Response.json(
        { message: `최근 종가는 한 번에 ${MAX_QUOTE_SYMBOLS}개 종목까지 조회할 수 있습니다.` },
        { status: 400 },
      );
    }

    const quotes: StockQuote[] = [];
    const failures: QuoteFailure[] = [];

    for (const symbol of uniqueSymbols) {
      try {
        quotes.push(await getCachedDomesticStockQuote(symbol));
      } catch (error) {
        failures.push({
          symbol,
          message: error instanceof Error ? error.message : "최근 종가 조회에 실패했습니다.",
        });
      }
    }

    if (!quotes.length && failures.length) {
      return Response.json(
        { message: failures[0].message, failures },
        { status: 502 },
      );
    }

    return Response.json({ quotes, failures });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : "최근 종가 조회에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
