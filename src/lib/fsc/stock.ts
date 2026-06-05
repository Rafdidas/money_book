import { getFscConfig, getFscSecuritiesProductConfig } from "@/lib/fsc/config";
import type { StockQuote } from "@/types/stock";

type FscStockPriceItem = {
  basDt?: string;
  srtnCd?: string;
  clpr?: string;
  vs?: string;
  fltRt?: string;
};

type FscStockPriceResponse = {
  response?: {
    header?: {
      resultCode?: string;
      resultMsg?: string;
    };
    body?: {
      items?: {
        item?: FscStockPriceItem | FscStockPriceItem[];
      };
    };
  };
};

const LOOKBACK_DAYS = 10;
const toNumber = (value: string | undefined) => {
  const parsed = Number(String(value ?? "").replaceAll(",", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatKstDate = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date).replaceAll("-", "");
};

const getRecentBasDtRange = () => {
  const endDate = new Date();
  const beginDate = new Date(endDate);
  beginDate.setDate(endDate.getDate() - LOOKBACK_DAYS);

  return {
    beginBasDt: formatKstDate(beginDate),
    endBasDt: formatKstDate(endDate),
  };
};

const toItems = (item: FscStockPriceItem | FscStockPriceItem[] | undefined) => {
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
};

const toServiceKeyParam = (serviceKey: string) =>
  serviceKey.includes("%") ? serviceKey : encodeURIComponent(serviceKey);

const fetchFscPriceItems = async (
  endpoint: string,
  symbol: string,
  config: ReturnType<typeof getFscConfig>,
  range: ReturnType<typeof getRecentBasDtRange>,
) => {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const params = new URLSearchParams({
    numOfRows: "10",
    pageNo: "1",
    resultType: "json",
    likeSrtnCd: normalizedSymbol,
    beginBasDt: range.beginBasDt,
    endBasDt: range.endBasDt,
  });
  const response = await fetch(
    `${config.baseUrl}/${endpoint}?serviceKey=${toServiceKeyParam(config.serviceKey)}&${params}`,
    {
      cache: "no-store",
    },
  );
  const data = (await response.json()) as FscStockPriceResponse;
  const resultCode = data.response?.header?.resultCode;
  const resultMsg = data.response?.header?.resultMsg;

  if (!response.ok || resultCode !== "00") {
    throw new Error(resultMsg || `${symbol} 최근 종가 조회에 실패했습니다.`);
  }

  return toItems(data.response?.body?.items?.item)
    .filter((item) => item.srtnCd?.trim().toUpperCase() === normalizedSymbol && item.basDt)
    .sort((left, right) => String(right.basDt).localeCompare(String(left.basDt)));
};

export const getFscDomesticStockQuote = async (symbol: string): Promise<StockQuote> => {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const stockConfig = getFscConfig();
  const range = getRecentBasDtRange();
  const stockItems = await fetchFscPriceItems(
    "getStockPriceInfo",
    normalizedSymbol,
    stockConfig,
    range,
  );
  let quote = stockItems[0];

  if (!quote) {
    const productConfig = getFscSecuritiesProductConfig();
    const etfItems = await fetchFscPriceItems(
      "getETFPriceInfo",
      normalizedSymbol,
      productConfig,
      range,
    );
    quote = etfItems[0];
  }

  if (!quote) {
    throw new Error(`${normalizedSymbol}의 최근 거래일 종가를 찾지 못했습니다. 주식시세와 ETF시세를 조회했지만 결과가 없었습니다.`);
  }

  return {
    symbol: normalizedSymbol,
    currentPrice: toNumber(quote.clpr),
    dailyChange: toNumber(quote.vs),
    dailyChangeRate: toNumber(quote.fltRt),
    baseDate: quote.basDt,
    updatedAt: new Date().toISOString(),
  };
};
