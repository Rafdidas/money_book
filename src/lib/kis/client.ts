import { inflateRawSync } from "node:zlib";
import type { StockSearchItem } from "@/types/stock";
import { normalizeStockSearchText } from "@/utils/stock";

let stockMasterCache: {
  entries: StockSearchEntry[];
  expiresAt: number;
} | null = null;
let stockMasterPromise: Promise<StockSearchEntry[]> | null = null;

type StockSearchEntry = {
  item: StockSearchItem;
  normalizedName: string;
  normalizedSymbol: string;
};

const STOCK_MASTER_TTL = 1000 * 60 * 60 * 12;
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
      const symbol = row.slice(0, 9).trim().replace(/^A/, "").toUpperCase();
      const nameEndOffset = market === "KOSPI" ? 228 : 222;
      const name = row.slice(21, Math.max(21, row.length - nameEndOffset)).trim();

      if (!/^[0-9A-Z]{6}$/.test(symbol) || !name) return null;

      return {
        symbol,
        name,
        market,
      };
    })
    .filter((item): item is StockSearchItem => Boolean(item));
};

const loadStockMaster = async () => {
  const now = Date.now();
  if (stockMasterCache && stockMasterCache.expiresAt > now) {
    return stockMasterCache.entries;
  }
  if (stockMasterPromise) return stockMasterPromise;

  stockMasterPromise = Promise.all(
    MASTER_FILES.map(async (file) => {
      const response = await fetch(file.url, {
        next: { revalidate: STOCK_MASTER_TTL / 1000 },
      });
      if (!response.ok) {
        throw new Error(`${file.market} 종목 정보를 가져오지 못했습니다.`);
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      return decodeStockMaster(extractFirstZipFile(bytes), file.market);
    }),
  ).then((itemsByMarket) =>
    itemsByMarket.flat().map((item) => ({
      item,
      normalizedName: normalizeStockSearchText(item.name),
      normalizedSymbol: normalizeStockSearchText(item.symbol),
    })),
  );

  try {
    const entries = await stockMasterPromise;
    stockMasterCache = {
      entries,
      expiresAt: Date.now() + STOCK_MASTER_TTL,
    };
    return entries;
  } finally {
    stockMasterPromise = null;
  }
};

export const searchKisStocks = async (query: string) => {
  const keyword = normalizeStockSearchText(query);
  if (!keyword) return [];

  const entries = await loadStockMaster();

  return entries
    .map((entry) => {
      const { normalizedName, normalizedSymbol } = entry;
      let score = Number.POSITIVE_INFINITY;

      if (normalizedSymbol === keyword) score = 0;
      else if (normalizedName === keyword) score = 1;
      else if (normalizedSymbol.startsWith(keyword)) score = 2;
      else if (normalizedName.startsWith(keyword)) score = 3;
      else if (normalizedSymbol.includes(keyword)) score = 4;
      else if (normalizedName.includes(keyword)) score = 5;

      return { ...entry, score };
    })
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => left.score - right.score || left.item.name.localeCompare(right.item.name, "ko"))
    .slice(0, 12)
    .map((entry) => entry.item);
};
