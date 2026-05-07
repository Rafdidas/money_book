import { inflateRawSync } from "node:zlib";
import { getKisConfig } from "@/lib/kis/config";
import type { StockQuote, StockSearchItem } from "@/types/stock";

type KisToken = {
  value: string;
  expiresAt: number;
};

type KisQuoteOutput = {
  stck_prpr?: string;
  prdy_vrss?: string;
  prdy_vrss_sign?: string;
  prdy_ctrt?: string;
};

let tokenCache: KisToken | null = null;
let stockMasterCache: {
  items: StockSearchItem[];
  expiresAt: number;
} | null = null;

const STOCK_MASTER_TTL = 1000 * 60 * 60 * 12;
const TOKEN_TTL_FALLBACK = 1000 * 60 * 60 * 23;
const MASTER_FILES = [
  {
    market: "KOSPI",
    url: "https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip",
  },
  {
    market: "KOSDAQ",
    url: "https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip",
  },
];

const toNumber = (value: string | undefined) => {
  const parsed = Number(String(value ?? "").replaceAll(",", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const readUInt32LE = (bytes: Uint8Array, offset: number) =>
  bytes[offset] |
  (bytes[offset + 1] << 8) |
  (bytes[offset + 2] << 16) |
  (bytes[offset + 3] << 24);

const readUInt16LE = (bytes: Uint8Array, offset: number) =>
  bytes[offset] | (bytes[offset + 1] << 8);

const extractFirstZipFile = (bytes: Uint8Array) => {
  if (readUInt32LE(bytes, 0) !== 0x04034b50) {
    throw new Error("Invalid KIS stock master zip.");
  }

  const method = readUInt16LE(bytes, 8);
  const compressedSize = readUInt32LE(bytes, 18);
  const fileNameLength = readUInt16LE(bytes, 26);
  const extraLength = readUInt16LE(bytes, 28);
  const dataStart = 30 + fileNameLength + extraLength;
  const compressed = bytes.slice(dataStart, dataStart + compressedSize);

  if (method === 0) return Buffer.from(compressed);
  if (method === 8) return inflateRawSync(Buffer.from(compressed));

  throw new Error(`Unsupported KIS stock master compression method: ${method}`);
};

const decodeStockMaster = (buffer: Buffer, market: string): StockSearchItem[] => {
  const decoder = new TextDecoder("euc-kr");
  const text = decoder.decode(buffer);

  return text
    .split(/\r?\n/)
    .map((row) => {
      if (row.length < 30) return null;
      const symbol = row.slice(0, 9).trim().replace(/^A/, "");
      const nameEndOffset = market === "KOSPI" ? 228 : 222;
      const name = row.slice(21, Math.max(21, row.length - nameEndOffset)).trim();

      if (!/^\d{6}$/.test(symbol) || !name) return null;

      return {
        symbol,
        name,
        market,
      };
    })
    .filter((item): item is StockSearchItem => Boolean(item));
};

const getKisAccessToken = async () => {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 1000 * 60) {
    return tokenCache.value;
  }

  const config = getKisConfig();
  const response = await fetch(`${config.baseUrl}/oauth2/tokenP`, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: config.appKey,
      appsecret: config.appSecret,
    }),
  });

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number | string;
    error_description?: string;
    msg1?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.msg1 || "KIS 토큰 발급에 실패했습니다.");
  }

  const expiresIn = Number(data.expires_in);
  tokenCache = {
    value: data.access_token,
    expiresAt: now + (Number.isFinite(expiresIn) ? expiresIn * 1000 : TOKEN_TTL_FALLBACK),
  };

  return tokenCache.value;
};

export const searchKisStocks = async (query: string) => {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return [];

  const now = Date.now();
  if (!stockMasterCache || stockMasterCache.expiresAt <= now) {
    const items = (
      await Promise.all(
        MASTER_FILES.map(async (file) => {
          const response = await fetch(file.url, { cache: "no-store" });
          if (!response.ok) {
            throw new Error(`${file.market} 종목 정보를 가져오지 못했습니다.`);
          }
          const bytes = new Uint8Array(await response.arrayBuffer());
          return decodeStockMaster(extractFirstZipFile(bytes), file.market);
        }),
      )
    ).flat();

    stockMasterCache = {
      items,
      expiresAt: now + STOCK_MASTER_TTL,
    };
  }

  return stockMasterCache.items
    .filter((item) =>
      item.name.toLowerCase().includes(keyword) || item.symbol.includes(keyword),
    )
    .slice(0, 12);
};

export const getKisDomesticQuote = async (symbol: string): Promise<StockQuote> => {
  const config = getKisConfig();
  const accessToken = await getKisAccessToken();
  const params = new URLSearchParams({
    FID_COND_MRKT_DIV_CODE: "J",
    FID_INPUT_ISCD: symbol,
  });
  const response = await fetch(
    `${config.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price?${params}`,
    {
      headers: {
        authorization: `Bearer ${accessToken}`,
        appkey: config.appKey,
        appsecret: config.appSecret,
        tr_id: "FHKST01010100",
        custtype: "P",
      },
      cache: "no-store",
    },
  );
  const data = (await response.json()) as {
    rt_cd?: string;
    msg1?: string;
    output?: KisQuoteOutput;
  };

  if (!response.ok || data.rt_cd !== "0" || !data.output) {
    throw new Error(data.msg1 || `${symbol} 현재가 조회에 실패했습니다.`);
  }

  const dailyChangeSign = data.output.prdy_vrss_sign;
  const dailyChangeAmount = Math.abs(toNumber(data.output.prdy_vrss));
  const dailyChangeRate = Math.abs(toNumber(data.output.prdy_ctrt));
  const isDailyLoss = dailyChangeSign === "4" || dailyChangeSign === "5";

  return {
    symbol,
    currentPrice: toNumber(data.output.stck_prpr),
    dailyChange: isDailyLoss ? -dailyChangeAmount : dailyChangeAmount,
    dailyChangeRate: isDailyLoss ? -dailyChangeRate : dailyChangeRate,
    updatedAt: new Date().toISOString(),
  };
};
