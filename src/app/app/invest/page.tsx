"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppIcon from "@/components/common/AppIcon";
import SideMenu from "@/components/common/SideMenu";
import { useAppAlert } from "@/components/app-alert/AppAlertProvider";
import { useAppData } from "@/app/providers";
import {
  DEMO_INVESTMENT_OWNER_KEY,
  DEMO_STOCK_HOLDINGS_VERSION_STORAGE_KEY,
} from "@/lib/demo";
import {
  createInvestmentStock,
  createInvestmentStocks,
  deleteInvestmentStock,
  getInvestmentAccountLimits,
  getInvestmentStocks,
  updateInvestmentStock,
  upsertInvestmentAccountLimit,
} from "@/lib/api/investments";
import type {
  InvestmentAccountLimits,
  InvestmentAccountType,
  InvestmentCurrency,
  InvestmentStock,
  LimitAccountType,
  StockQuote,
  StockSearchItem,
} from "@/types/stock";
import { formatDate } from "@/utils/date";
import {
  formatDecimalInput,
  formatIntegerInput,
  parseFormattedNumber,
} from "@/utils/numberInput";
import { normalizeStockSearchText } from "@/utils/stock";
import "../../invest/invest.scss";

const formatWon = (value: number) =>
  `${value < 0 ? "-" : ""}${Math.round(Math.abs(value)).toLocaleString()}원`;
const formatKoreanNumber = (value: number) => {
  const units = [
    { value: 1000, label: "천" },
    { value: 100, label: "백" },
    { value: 10, label: "십" },
  ];
  let remainder = value;
  let result = "";

  units.forEach((unit) => {
    const count = Math.floor(remainder / unit.value);
    if (!count) return;
    result += `${count === 1 ? "" : count}${unit.label}`;
    remainder %= unit.value;
  });

  return `${result}${remainder || ""}`;
};
const formatKoreanWon = (value: number) => {
  const roundedValue = Math.floor(value);
  if (!roundedValue) return "";
  if (roundedValue < 10000) return formatWon(roundedValue);

  const eok = Math.floor(roundedValue / 100000000);
  const man = Math.floor((roundedValue % 100000000) / 10000);
  const parts = [];

  if (eok) parts.push(`${formatKoreanNumber(eok)}억`);
  if (man) parts.push(`${formatKoreanNumber(man)}만`);

  return `${parts.join(" ")}원`;
};
const stockAutoRefreshKeyPrefix = "money-book-stock-last-refresh";
const stockHoldingsStoragePrefix = "money-book:stock-holdings";
const stockQuotesStoragePrefix = "money-book:stock-quotes";
const investmentAccountLimitsStoragePrefix = "money-book:investment-account-limits";
const currentDemoStockHoldingsVersion = "1";
const stockSearchResultCache = new Map<string, StockSearchItem[]>();
const stockSearchResultCacheLimit = 50;
const stockQuoteBatchSize = 20;

type StockSortKey = "name" | "totalProfit" | "averagePrice" | "totalCost" | "dailyProfit";
type SortDirection = "asc" | "desc";
type StockSort = {
  key: StockSortKey;
  direction: SortDirection;
} | null;

type InvestmentSummary = {
  groupKey: string;
  symbol: string;
  name: string;
  market: string;
  accountType: InvestmentAccountType;
  currency: InvestmentCurrency;
  quantity: number;
  totalCost: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  totalProfit: number;
  totalProfitRate: number;
  dailyProfit: number;
  dailyProfitRate: number;
  hasQuote: boolean;
};

type InvestmentAllocation = {
  key: string;
  label: string;
  detail: string;
  currentValue: number;
  rate: number;
};

const getChangeClassName = (value: number) =>
  value > 0 ? "color-red" : value < 0 ? "color-blue" : "color-gray";
const investmentAccountLabel: Record<InvestmentAccountType, string> = {
  GENERAL: "일반계좌",
  ISA: "ISA",
  PENSION: "연금저축",
};
const limitAccountBadgeClassName: Record<LimitAccountType, string> = {
  ISA: "badge--violet",
  PENSION: "badge--green",
};
const allocationBadgeClassName: Record<string, string> = {
  "종목별 비중": "badge--blue",
  "계좌별 배분": "badge--violet",
  "시장별 배분": "badge--green",
  "통화별 배분": "badge--teal",
};
const limitAccountTypes: LimitAccountType[] = ["ISA", "PENSION"];
const formatSignedPercent = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
const formatSignedWon = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "-" : ""}${Math.round(Math.abs(value)).toLocaleString()}원`;
const formatBaseDate = (baseDate: string | undefined) => {
  if (!baseDate || !/^\d{8}$/.test(baseDate)) return "";
  return `${baseDate.slice(0, 4)}.${baseDate.slice(4, 6)}.${baseDate.slice(6, 8)}`;
};
const getStockAutoRefreshKey = (ownerKey: string) =>
  `${stockAutoRefreshKeyPrefix}:${ownerKey || "local"}`;
const shouldRefreshStockQuotes = (ownerKey: string) => {
  if (typeof window === "undefined") return false;
  const lastRefresh = Number(window.localStorage.getItem(getStockAutoRefreshKey(ownerKey)) || 0);
  if (!lastRefresh) return true;
  return Date.now() - lastRefresh >= 1000 * 60 * 60 * 12;
};

const getStockHoldingsStorageKey = (ownerKey: string) =>
  `${stockHoldingsStoragePrefix}:${ownerKey || "local"}`;
const getInvestmentGroupKey = (stock: {
  accountType: InvestmentAccountType;
  market: string;
  symbol: string;
  currency: InvestmentCurrency;
}) => `${stock.accountType}:${stock.market}:${stock.symbol}:${stock.currency}`;
const toInvestmentStockPayload = (stock: InvestmentStock) => ({
  symbol: stock.symbol,
  name: stock.name,
  market: stock.market,
  quantity: stock.quantity,
  unitPrice: stock.unitPrice,
  purchaseDate: stock.purchaseDate,
  accountType: stock.accountType,
  currency: stock.currency,
  memo: stock.memo,
});

const readStoredInvestmentStocks = (ownerKey: string): InvestmentStock[] => {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(getStockHoldingsStorageKey(ownerKey)) || "[]",
    ) as Partial<InvestmentStock>[];

    return parsed.flatMap((item) => {
      if (
        typeof item.id !== "string" ||
        typeof item.createdAt !== "string" ||
        typeof item.symbol !== "string" ||
        typeof item.name !== "string" ||
        typeof item.market !== "string" ||
        typeof item.quantity !== "number" ||
        typeof item.unitPrice !== "number" ||
        (item.purchaseDate !== null && typeof item.purchaseDate !== "string")
      ) {
        return [];
      }

      return [{
        ...item,
        accountType: item.accountType ?? "GENERAL",
        currency: "KRW",
        memo: typeof item.memo === "string" ? item.memo : "",
      } as InvestmentStock];
    });
  } catch {
    return [];
  }
};

const writeStoredInvestmentStocks = (ownerKey: string, stocks: InvestmentStock[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStockHoldingsStorageKey(ownerKey), JSON.stringify(stocks));
};

const getStockQuotesStorageKey = (ownerKey: string) =>
  `${stockQuotesStoragePrefix}:${ownerKey || "local"}`;

const readStoredStockQuotes = (ownerKey: string): Record<string, StockQuote> => {
  if (typeof window === "undefined") return {};

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(getStockQuotesStorageKey(ownerKey)) || "{}",
    ) as Record<string, Partial<StockQuote>>;

    return Object.entries(stored).reduce<Record<string, StockQuote>>((quotes, [symbol, quote]) => {
      if (
        typeof quote.symbol === "string" &&
        typeof quote.currentPrice === "number" &&
        typeof quote.dailyChange === "number" &&
        typeof quote.dailyChangeRate === "number" &&
        typeof quote.updatedAt === "string"
      ) {
        quotes[symbol] = quote as StockQuote;
      }
      return quotes;
    }, {});
  } catch {
    return {};
  }
};

const writeStoredStockQuotes = (ownerKey: string, quotes: Record<string, StockQuote>) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStockQuotesStorageKey(ownerKey), JSON.stringify(quotes));
};

const getInvestmentAccountLimitsStorageKey = (ownerKey: string, year: number) =>
  `${investmentAccountLimitsStoragePrefix}:${ownerKey || "local"}:${year}`;

const readStoredInvestmentAccountLimits = (
  ownerKey: string,
  year: number,
): InvestmentAccountLimits => {
  if (typeof window === "undefined") return { ISA: 0, PENSION: 0 };

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(getInvestmentAccountLimitsStorageKey(ownerKey, year)) || "{}",
    ) as Partial<InvestmentAccountLimits>;

    return {
      ISA: typeof stored.ISA === "number" && stored.ISA >= 0 ? stored.ISA : 0,
      PENSION: typeof stored.PENSION === "number" && stored.PENSION >= 0 ? stored.PENSION : 0,
    };
  } catch {
    return { ISA: 0, PENSION: 0 };
  }
};

const writeStoredInvestmentAccountLimits = (
  ownerKey: string,
  year: number,
  limits: InvestmentAccountLimits,
) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    getInvestmentAccountLimitsStorageKey(ownerKey, year),
    JSON.stringify(limits),
  );
};

const createDemoInvestmentStocks = (referenceDate: Date): InvestmentStock[] => {
  const formatPurchaseDate = (monthOffset: number, day: number) =>
    formatDate(new Date(referenceDate.getFullYear(), referenceDate.getMonth() + monthOffset, day));

  return [
    {
      id: "demo-stock-samsung-current",
      symbol: "005930",
      name: "삼성전자",
      market: "KOSPI",
      quantity: 6,
      unitPrice: 70000,
      purchaseDate: formatPurchaseDate(0, 8),
      createdAt: new Date().toISOString(),
      accountType: "ISA",
      currency: "KRW",
      memo: "ISA 장기 보유",
    },
    {
      id: "demo-stock-samsung-prev",
      symbol: "005930",
      name: "삼성전자",
      market: "KOSPI",
      quantity: 5,
      unitPrice: 70000,
      purchaseDate: formatPurchaseDate(-1, 8),
      createdAt: new Date().toISOString(),
      accountType: "GENERAL",
      currency: "KRW",
      memo: "일반계좌 적립식 매수",
    },
  ];
};

const createDemoStockQuotes = (): Record<string, StockQuote> => ({
  "005930": {
    symbol: "005930",
    currentPrice: 74500,
    dailyChange: 900,
    dailyChangeRate: 1.22,
    baseDate: formatDate(new Date()).replaceAll("-", ""),
    updatedAt: new Date().toISOString(),
  },
});

export default function InvestPage() {
  const today = useMemo(() => new Date(), []);
  const {
    displayName,
    displayEmail,
    isDemoMode,
    isAuthResolved,
  } = useAppData();
  const { alert, confirm } = useAppAlert();
  const [stockQuery, setStockQuery] = useState("");
  const [isStockQueryComposing, setIsStockQueryComposing] = useState(false);
  const [stockSearchItems, setStockSearchItems] = useState<StockSearchItem[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockSearchItem | null>(null);
  const [stockPurchaseDate, setStockPurchaseDate] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockUnitPrice, setStockUnitPrice] = useState("");
  const [stockAccountType, setStockAccountType] = useState<InvestmentAccountType>("GENERAL");
  const [stockMemo, setStockMemo] = useState("");
  const [stockQuotes, setStockQuotes] = useState<Record<string, StockQuote>>({});
  const [stockSort, setStockSort] = useState<StockSort>(null);
  const [investmentStocks, setInvestmentStocks] = useState<InvestmentStock[]>([]);
  const [selectedGroupKey, setSelectedGroupKey] = useState("");
  const [editingStockId, setEditingStockId] = useState("");
  const [isStockSearching, setIsStockSearching] = useState(false);
  const [isStockSubmitting, setIsStockSubmitting] = useState(false);
  const [deletingStockId, setDeletingStockId] = useState("");
  const [isStockRefreshing, setIsStockRefreshing] = useState(false);
  const [stockQuoteMessage, setStockQuoteMessage] = useState("");
  const [isStockPanelOpen, setIsStockPanelOpen] = useState(true);
  const limitYear = today.getFullYear();
  const [accountLimits, setAccountLimits] = useState<InvestmentAccountLimits>({
    ISA: 0,
    PENSION: 0,
  });
  const [accountLimitInputs, setAccountLimitInputs] = useState<Record<LimitAccountType, string>>({
    ISA: "",
    PENSION: "",
  });
  const stockSearchRequestId = useRef(0);
  const storageOwnerKey = isDemoMode ? DEMO_INVESTMENT_OWNER_KEY : displayEmail || "local";

  const investmentSummaries = useMemo<InvestmentSummary[]>(() => {
    const grouped = investmentStocks.reduce<Record<string, InvestmentSummary>>((acc, stock) => {
      const quote = stockQuotes[stock.symbol];
      const totalCost = stock.quantity * stock.unitPrice;
      const groupKey = getInvestmentGroupKey(stock);

      if (!acc[groupKey]) {
        acc[groupKey] = {
          groupKey,
          symbol: stock.symbol,
          name: stock.name,
          market: stock.market,
          accountType: stock.accountType,
          currency: stock.currency,
          quantity: 0,
          totalCost: 0,
          averagePrice: 0,
          currentPrice: quote?.currentPrice ?? 0,
          currentValue: 0,
          totalProfit: 0,
          totalProfitRate: 0,
          dailyProfit: 0,
          dailyProfitRate: 0,
          hasQuote: Boolean(quote),
        };
      }

      acc[groupKey].quantity += stock.quantity;
      acc[groupKey].totalCost += totalCost;
      acc[groupKey].currentPrice = quote?.currentPrice ?? acc[groupKey].currentPrice;
      acc[groupKey].dailyProfitRate = quote?.dailyChangeRate ?? acc[groupKey].dailyProfitRate;
      acc[groupKey].dailyProfit += (quote?.dailyChange ?? 0) * stock.quantity;
      acc[groupKey].hasQuote = acc[groupKey].hasQuote || Boolean(quote);

      return acc;
    }, {});

    const summaries = Object.values(grouped).map((summary) => {
      const averagePrice = summary.quantity ? summary.totalCost / summary.quantity : 0;
      const currentValue = summary.currentPrice * summary.quantity;
      const totalProfit = summary.currentPrice ? currentValue - summary.totalCost : 0;

      return {
        ...summary,
        averagePrice,
        currentValue,
        totalProfit,
        totalProfitRate: summary.totalCost ? (totalProfit / summary.totalCost) * 100 : 0,
      };
    });

    if (!stockSort) return summaries;

    return [...summaries].sort((left, right) => {
      const multiplier = stockSort.direction === "asc" ? 1 : -1;
      if (stockSort.key === "name") {
        return left.name.localeCompare(right.name, "ko") * multiplier;
      }
      return (left[stockSort.key] - right[stockSort.key]) * multiplier;
    });
  }, [investmentStocks, stockQuotes, stockSort]);
  const stockSymbols = useMemo(
    () => [...new Set(investmentStocks.map((stock) => stock.symbol))],
    [investmentStocks],
  );
  const investmentTotals = useMemo(() => {
    const totalCost = investmentSummaries.reduce((sum, stock) => sum + stock.totalCost, 0);
    const currentValue = investmentSummaries.reduce((sum, stock) => sum + stock.currentValue, 0);
    const totalProfit = currentValue - totalCost;
    const dailyProfit = investmentSummaries.reduce((sum, stock) => sum + stock.dailyProfit, 0);
    const previousValue = currentValue - dailyProfit;
    const isValuationReady =
      investmentSummaries.length > 0 &&
      investmentSummaries.every((stock) => stock.hasQuote);

    return {
      totalCost,
      currentValue,
      totalProfit,
      totalProfitRate: totalCost ? (totalProfit / totalCost) * 100 : 0,
      dailyProfit,
      dailyProfitRate: previousValue ? (dailyProfit / previousValue) * 100 : 0,
      isValuationReady,
    };
  }, [investmentSummaries]);
  const portfolioAllocations = useMemo(() => {
    const toAllocations = (
      items: Array<Omit<InvestmentAllocation, "rate">>,
    ): InvestmentAllocation[] =>
      items
        .filter((item) => item.currentValue > 0)
        .map((item) => ({
          ...item,
          rate: investmentTotals.currentValue
            ? (item.currentValue / investmentTotals.currentValue) * 100
            : 0,
        }))
        .sort((left, right) => right.currentValue - left.currentValue);

    const stockAllocations = investmentSummaries.reduce<
      Record<string, Omit<InvestmentAllocation, "rate">>
    >((acc, stock) => {
      const key = `${stock.market}:${stock.symbol}:${stock.currency}`;

      if (!acc[key]) {
        acc[key] = {
          key,
          label: stock.name,
          detail: `${stock.symbol} · ${stock.market}`,
          currentValue: 0,
        };
      }

      acc[key].currentValue += stock.currentValue;
      return acc;
    }, {});

    const accountAllocations = investmentSummaries.reduce<
      Record<string, Omit<InvestmentAllocation, "rate">>
    >((acc, stock) => {
      if (!acc[stock.accountType]) {
        acc[stock.accountType] = {
          key: stock.accountType,
          label: investmentAccountLabel[stock.accountType],
          detail: "계좌별 평가금액",
          currentValue: 0,
        };
      }

      acc[stock.accountType].currentValue += stock.currentValue;
      return acc;
    }, {});

    const marketAllocations = investmentSummaries.reduce<
      Record<string, Omit<InvestmentAllocation, "rate">>
    >((acc, stock) => {
      if (!acc[stock.market]) {
        acc[stock.market] = {
          key: stock.market,
          label: stock.market,
          detail: "시장별 평가금액",
          currentValue: 0,
        };
      }

      acc[stock.market].currentValue += stock.currentValue;
      return acc;
    }, {});

    const currencyAllocations = investmentSummaries.reduce<
      Record<string, Omit<InvestmentAllocation, "rate">>
    >((acc, stock) => {
      if (!acc[stock.currency]) {
        acc[stock.currency] = {
          key: stock.currency,
          label: stock.currency,
          detail: "통화별 평가금액",
          currentValue: 0,
        };
      }

      acc[stock.currency].currentValue += stock.currentValue;
      return acc;
    }, {});

    return [
      { title: "종목별 비중", items: toAllocations(Object.values(stockAllocations)) },
      { title: "계좌별 배분", items: toAllocations(Object.values(accountAllocations)) },
      { title: "시장별 배분", items: toAllocations(Object.values(marketAllocations)) },
      { title: "통화별 배분", items: toAllocations(Object.values(currencyAllocations)) },
    ];
  }, [investmentSummaries, investmentTotals.currentValue]);
  const selectedSummary = useMemo(
    () =>
      investmentSummaries.find((stock) => stock.groupKey === selectedGroupKey) ??
      investmentSummaries[0] ??
      null,
    [investmentSummaries, selectedGroupKey],
  );
  const selectedPurchaseRecords = useMemo(
    () =>
      selectedSummary
        ? investmentStocks
            .filter((stock) => getInvestmentGroupKey(stock) === selectedSummary.groupKey)
            .sort((left, right) => {
              if (left.purchaseDate && right.purchaseDate) {
                return right.purchaseDate.localeCompare(left.purchaseDate);
              }
              if (left.purchaseDate) return -1;
              if (right.purchaseDate) return 1;
              return right.createdAt.localeCompare(left.createdAt);
            })
        : [],
    [investmentStocks, selectedSummary],
  );
  const accountLimitSummaries = useMemo(
    () =>
      limitAccountTypes.map((accountType) => {
        const investedAmount = investmentStocks
          .filter(
            (stock) =>
              stock.accountType === accountType &&
              stock.purchaseDate?.startsWith(`${limitYear}-`),
          )
          .reduce((sum, stock) => sum + stock.quantity * stock.unitPrice, 0);
        const yearlyLimit = accountLimits[accountType];
        const remainingAmount = yearlyLimit ? yearlyLimit - investedAmount : 0;
        const usageRate = yearlyLimit ? (investedAmount / yearlyLimit) * 100 : 0;

        return {
          accountType,
          investedAmount,
          yearlyLimit,
          remainingAmount,
          usageRate,
        };
      }),
    [accountLimits, investmentStocks, limitYear],
  );
  const latestQuoteUpdatedAt = useMemo(() => {
    const updatedTimes = Object.values(stockQuotes)
      .map((quote) => new Date(quote.updatedAt).getTime())
      .filter((value) => Number.isFinite(value));

    if (!updatedTimes.length) return "";

    return new Date(Math.max(...updatedTimes)).toLocaleString("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [stockQuotes]);
  const latestQuoteBaseDate = useMemo(() => {
    const baseDates = Object.values(stockQuotes)
      .map((quote) => quote.baseDate)
      .filter((baseDate): baseDate is string => Boolean(baseDate && /^\d{8}$/.test(baseDate)));

    if (!baseDates.length) return "";

    return formatBaseDate(baseDates.sort((left, right) => right.localeCompare(left))[0]);
  }, [stockQuotes]);

  const resetStockForm = useCallback(() => {
    setStockQuery("");
    setStockSearchItems([]);
    setSelectedStock(null);
    setStockPurchaseDate("");
    setStockQuantity("");
    setStockUnitPrice("");
    setStockAccountType("GENERAL");
    setStockMemo("");
    setEditingStockId("");
  }, []);

  const startStockCreate = () => {
    resetStockForm();
    setIsStockPanelOpen(true);
  };

  const startStockEdit = (stock: InvestmentStock) => {
    setSelectedStock({
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market,
    });
    setStockQuery(`${stock.name} (${stock.symbol})`);
    setStockSearchItems([]);
    setStockPurchaseDate(stock.purchaseDate ?? "");
    setStockQuantity(stock.quantity.toLocaleString());
    setStockUnitPrice(stock.unitPrice.toLocaleString());
    setStockAccountType(stock.accountType);
    setStockMemo(stock.memo);
    setEditingStockId(stock.id);
    setIsStockPanelOpen(true);
  };

  const refreshStockQuotes = useCallback(async (symbols = stockSymbols) => {
    if (!symbols.length || isDemoMode || !displayEmail) return;

    try {
      setIsStockRefreshing(true);
      const uniqueSymbols = [...new Set(symbols)];
      const quotes: StockQuote[] = [];
      const failures: { symbol: string; message: string }[] = [];

      for (let index = 0; index < uniqueSymbols.length; index += stockQuoteBatchSize) {
        const batch = uniqueSymbols.slice(index, index + stockQuoteBatchSize);
        const response = await fetch("/api/stocks/quotes", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ symbols: batch }),
        });
        const data = (await response.json()) as {
          quotes?: StockQuote[];
          failures?: { symbol: string; message: string }[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message || "최근 종가 업데이트에 실패했습니다.");
        }

        quotes.push(...(data.quotes || []));
        failures.push(...(data.failures || []));
      }

      setStockQuotes((prev) => {
        const next = {
          ...prev,
          ...quotes.reduce<Record<string, StockQuote>>((acc, quote) => {
            acc[quote.symbol] = quote;
            return acc;
          }, {}),
        };
        writeStoredStockQuotes(storageOwnerKey, next);
        return next;
      });
      setStockQuoteMessage(
        failures.length
          ? `${failures.length}개 종목은 최근 종가를 불러오지 못했습니다.`
          : "",
      );
      window.localStorage.setItem(getStockAutoRefreshKey(storageOwnerKey), String(Date.now()));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "최근 종가 업데이트 중 오류가 발생했습니다.";
      setStockQuoteMessage(
        Object.keys(stockQuotes).length
          ? "최근 종가를 새로 불러오지 못해 마지막 조회 값을 표시하고 있습니다."
          : message,
      );
      if (!Object.keys(stockQuotes).length) {
        alert(message);
      }
    } finally {
      setIsStockRefreshing(false);
    }
  }, [alert, displayEmail, isDemoMode, stockQuotes, stockSymbols, storageOwnerKey]);

  const handleStockSort = (key: StockSortKey) => {
    setStockSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const handleStockSubmit = async () => {
    const quantity = parseFormattedNumber(stockQuantity);
    const unitPrice = parseFormattedNumber(stockUnitPrice);
    if (!selectedStock) {
      alert("종목을 선택해주세요.");
      return;
    }
    if (
      stockPurchaseDate &&
      Number.isNaN(new Date(`${stockPurchaseDate}T00:00:00`).getTime())
    ) {
      alert("구매일을 올바르게 입력해주세요.");
      return;
    }
    if (!quantity || quantity <= 0) {
      alert("수량을 입력해주세요.");
      return;
    }
    if (!unitPrice || unitPrice <= 0) {
      alert("매입단가를 입력해주세요.");
      return;
    }

    const stockPayload: Omit<InvestmentStock, "id" | "createdAt"> = {
      ...selectedStock,
      quantity,
      unitPrice,
      purchaseDate: stockPurchaseDate || null,
      accountType: stockAccountType,
      currency: "KRW",
      memo: stockMemo.trim(),
    };

    try {
      setIsStockSubmitting(true);
      let savedStock: InvestmentStock;

      if (isDemoMode) {
        savedStock = {
          ...stockPayload,
          id: editingStockId || `stock-${selectedStock.symbol}-${Date.now()}`,
          createdAt:
            investmentStocks.find((stock) => stock.id === editingStockId)?.createdAt ??
            new Date().toISOString(),
        };
        setInvestmentStocks((prev) => {
          const next = editingStockId
            ? prev.map((stock) => (stock.id === editingStockId ? savedStock : stock))
            : [savedStock, ...prev];
          writeStoredInvestmentStocks(storageOwnerKey, next);
          return next;
        });
      } else {
        savedStock = editingStockId
          ? await updateInvestmentStock(editingStockId, stockPayload)
          : await createInvestmentStock(stockPayload);
        setInvestmentStocks((prev) =>
          editingStockId
            ? prev.map((stock) => (stock.id === editingStockId ? savedStock : stock))
            : [savedStock, ...prev],
        );
      }

      setSelectedGroupKey(getInvestmentGroupKey(savedStock));
      await refreshStockQuotes([selectedStock.symbol]);

      resetStockForm();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "주식 저장 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsStockSubmitting(false);
    }
  };

  const handleStockDelete = async (stock: InvestmentStock) => {
    const confirmed = await confirm(
      `${stock.name} 보유 기록을 삭제할까요?`,
    );
    if (!confirmed) return;

    try {
      setDeletingStockId(stock.id);
      if (!isDemoMode) {
        await deleteInvestmentStock(stock.id);
      }
      setInvestmentStocks((prev) => {
        const next = prev.filter((item) => item.id !== stock.id);
        if (isDemoMode) writeStoredInvestmentStocks(storageOwnerKey, next);
        return next;
      });

      if (editingStockId === stock.id) {
        resetStockForm();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "보유 기록 삭제에 실패했습니다.");
    } finally {
      setDeletingStockId("");
    }
  };

  const handleAccountLimitSave = async (accountType: LimitAccountType) => {
    const value = parseFormattedNumber(accountLimitInputs[accountType]);

    if (!Number.isFinite(value) || value < 0) {
      alert("연간 한도는 0원 이상의 금액으로 입력해주세요.");
      return;
    }

    const next = { ...accountLimits, [accountType]: value };
    try {
      if (isDemoMode) {
        writeStoredInvestmentAccountLimits(storageOwnerKey, limitYear, next);
      } else {
        await upsertInvestmentAccountLimit(limitYear, accountType, value);
      }
      setAccountLimits(next);
    } catch (error) {
      alert(error instanceof Error ? error.message : "연간 한도 저장에 실패했습니다.");
    }
  };

  useEffect(() => {
    const requestId = ++stockSearchRequestId.current;
    const query = stockQuery.trim();
    const normalizedQuery = normalizeStockSearchText(query);
    const selectedStockLabel = selectedStock
      ? `${selectedStock.name} (${selectedStock.symbol})`
      : "";

    if (
      isStockQueryComposing ||
      normalizedQuery.length < 2 ||
      normalizeStockSearchText(selectedStockLabel) === normalizedQuery
    ) {
      setStockSearchItems([]);
      setIsStockSearching(false);
      return;
    }

    const cachedItems = stockSearchResultCache.get(normalizedQuery);
    if (cachedItems) {
      if (requestId === stockSearchRequestId.current) {
        setStockSearchItems(cachedItems);
        setIsStockSearching(false);
      }
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsStockSearching(true);
        const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as {
          items?: StockSearchItem[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message || "종목 검색에 실패했습니다.");
        }
        const items = data.items || [];
        if (stockSearchResultCache.size >= stockSearchResultCacheLimit) {
          const oldestKey = stockSearchResultCache.keys().next().value;
          if (oldestKey) stockSearchResultCache.delete(oldestKey);
        }
        stockSearchResultCache.set(normalizedQuery, items);
        if (requestId === stockSearchRequestId.current) {
          setStockSearchItems(items);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (requestId === stockSearchRequestId.current) {
          setStockSearchItems([]);
        }
      } finally {
        if (requestId === stockSearchRequestId.current) {
          setIsStockSearching(false);
        }
      }
    }, 150);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isStockQueryComposing, selectedStock, stockQuery]);

  useEffect(() => {
    if (!isAuthResolved) return;
    let isCancelled = false;

    const loadInvestments = async () => {
      const storedQuotes = readStoredStockQuotes(storageOwnerKey);
      setStockQuoteMessage("");

      if (isDemoMode) {
        let storedStocks = readStoredInvestmentStocks(storageOwnerKey);
        const storedLimits = readStoredInvestmentAccountLimits(storageOwnerKey, limitYear);

        if (
          window.localStorage.getItem(DEMO_STOCK_HOLDINGS_VERSION_STORAGE_KEY) !==
          currentDemoStockHoldingsVersion
        ) {
          if (!storedStocks.length) {
            storedStocks = createDemoInvestmentStocks(today);
            writeStoredInvestmentStocks(storageOwnerKey, storedStocks);
          }
          window.localStorage.setItem(
            DEMO_STOCK_HOLDINGS_VERSION_STORAGE_KEY,
            currentDemoStockHoldingsVersion,
          );
        }
        setStockQuotes(createDemoStockQuotes());
        if (!isCancelled) {
          setInvestmentStocks(storedStocks);
          setAccountLimits(storedLimits);
          setAccountLimitInputs({
            ISA: storedLimits.ISA ? storedLimits.ISA.toLocaleString() : "",
            PENSION: storedLimits.PENSION ? storedLimits.PENSION.toLocaleString() : "",
          });
        }
        return;
      }

      try {
        let [stocks, limits] = await Promise.all([
          getInvestmentStocks(),
          getInvestmentAccountLimits(limitYear),
        ]);
        const legacyStocks = readStoredInvestmentStocks(storageOwnerKey);
        const legacyLimits = readStoredInvestmentAccountLimits(storageOwnerKey, limitYear);

        if (!stocks.length && legacyStocks.length) {
          stocks = await createInvestmentStocks(legacyStocks.map(toInvestmentStockPayload));
          window.localStorage.removeItem(getStockHoldingsStorageKey(storageOwnerKey));
        }

        for (const accountType of limitAccountTypes) {
          if (!limits[accountType] && legacyLimits[accountType]) {
            await upsertInvestmentAccountLimit(limitYear, accountType, legacyLimits[accountType]);
            limits = { ...limits, [accountType]: legacyLimits[accountType] };
          }
        }
        window.localStorage.removeItem(
          getInvestmentAccountLimitsStorageKey(storageOwnerKey, limitYear),
        );

        if (!isCancelled) {
          setStockQuotes(storedQuotes);
          setInvestmentStocks(stocks);
          setAccountLimits(limits);
          setAccountLimitInputs({
            ISA: limits.ISA ? limits.ISA.toLocaleString() : "",
            PENSION: limits.PENSION ? limits.PENSION.toLocaleString() : "",
          });
        }
      } catch (error) {
        if (!isCancelled) {
          alert(error instanceof Error ? error.message : "투자 데이터를 불러오지 못했습니다.");
        }
      }
    };

    void loadInvestments();

    return () => {
      isCancelled = true;
    };
  }, [alert, isAuthResolved, isDemoMode, limitYear, storageOwnerKey, today]);

  useEffect(() => {
    if (!isAuthResolved || isDemoMode || !displayEmail || !stockSymbols.length) return;
    if (!shouldRefreshStockQuotes(storageOwnerKey)) return;
    refreshStockQuotes();
  }, [displayEmail, isAuthResolved, isDemoMode, refreshStockQuotes, stockSymbols.length, storageOwnerKey]);

  if (!isAuthResolved) {
    return null;
  }

  return (
    <div className="home-page">
      <SideMenu
        displayName={displayName}
        displayEmail={displayEmail}
        isDemoMode={isDemoMode}
      />
      <main className="main invest-page column-group">
        <section className="main-header invest-header row-group row-group--center row-group--between">
          <div>
            <h2 className="main-header--title headline--sm">투자</h2>
            <p className="invest-header--description label--md">
              직접 입력한 보유 종목의 최근 거래일 종가 기준 평가금액과 수익률을
              확인합니다.
            </p>
          </div>
          <div className="invest-header--actions row-group row-group--center row-group--gap-8">
            <button
              type="button"
              className="button button--md button--outline refresh-btn"
              onClick={() => refreshStockQuotes()}
              disabled={isStockRefreshing || !stockSymbols.length || isDemoMode}
            >
              <AppIcon name="refresh" />
              {isStockRefreshing ? "업데이트 중" : "최근 종가 업데이트"}
            </button>
            <button
              type="button"
              className="button button--primary button--md"
              onClick={() => {
                if (isStockPanelOpen) {
                  setIsStockPanelOpen(false);
                  return;
                }
                startStockCreate();
              }}
            >
              {isStockPanelOpen ? "입력 닫기" : "+ 종목 추가"}
            </button>
          </div>
        </section>

        <section className="main-overview invest-overview column-group column-group--gap-16">
          <div className="invest-summary">
            <article className="card invest-summary--primary">
              <span className="label--md color-gray">총 평가금액</span>
              <strong className="invest-summary--major title--lg">
                {investmentTotals.isValuationReady
                  ? formatWon(investmentTotals.currentValue)
                  : "-"}
              </strong>
              <span className="caption--md color-gray">
                {investmentTotals.isValuationReady
                  ? latestQuoteBaseDate
                    ? `기준일 ${latestQuoteBaseDate}`
                    : latestQuoteUpdatedAt
                      ? `${latestQuoteUpdatedAt} 조회 기준`
                      : "최근 거래일 종가 기준 평가"
                  : "최근 종가 업데이트 후 표시"}
              </span>
            </article>
            <article className="card invest-summary--item">
              <span className="label--md color-gray">총 투자금액</span>
              <strong className="title--md">
                {formatWon(investmentTotals.totalCost)}
              </strong>
            </article>
            <article className="card invest-summary--item">
              <span className="label--md color-gray">총 평가손익</span>
              <strong
                className={`title--md ${investmentTotals.isValuationReady ? getChangeClassName(investmentTotals.totalProfit) : ""}`}
              >
                {investmentTotals.isValuationReady
                  ? formatSignedWon(investmentTotals.totalProfit)
                  : "-"}
              </strong>
            </article>
            <article className="card invest-summary--item">
              <span className="label--md color-gray">총 수익률</span>
              <strong
                className={`title--md ${investmentTotals.isValuationReady ? getChangeClassName(investmentTotals.totalProfitRate) : ""}`}
              >
                {investmentTotals.isValuationReady
                  ? formatSignedPercent(investmentTotals.totalProfitRate)
                  : "-"}
              </strong>
            </article>
            <article className="card invest-summary--item">
              <span className="label--md color-gray">전일 대비</span>
              <strong
                className={`title--md ${investmentTotals.isValuationReady ? getChangeClassName(investmentTotals.dailyProfit) : ""}`}
              >
                {investmentTotals.isValuationReady
                  ? formatSignedWon(investmentTotals.dailyProfit)
                  : "-"}
              </strong>
              <span
                className={`caption--md ${investmentTotals.isValuationReady ? getChangeClassName(investmentTotals.dailyProfitRate) : "color-gray"}`}
              >
                {investmentTotals.isValuationReady
                  ? `전일 대비 ${formatSignedPercent(investmentTotals.dailyProfitRate)}`
                  : "최근 종가 업데이트 후 표시"}
              </span>
            </article>
          </div>

          <section className="invest-limits column-group column-group--gap-8">
            <div className="invest-limits--heading row-group row-group--center row-group--between">
              <div>
                <h3 className="title--sm">절세계좌 한도</h3>
                <p className="caption--lg color-gray">
                  {limitYear}년 입력 한도 기준이며 실제 세제 혜택 한도와 다를 수 있습니다.
                </p>
              </div>
            </div>
            <div className="invest-limits--grid">
              {accountLimitSummaries.map((limit) => (
                <article key={limit.accountType} className="card invest-limit-card">
                  <div className="row-group row-group--center row-group--between">
                    <h4 className="title--sm">
                      {investmentAccountLabel[limit.accountType]}
                    </h4>
                    <span className={`badge ${limitAccountBadgeClassName[limit.accountType]}`}>
                      {limitYear}년
                    </span>
                  </div>
                  <div className="invest-limit-card--numbers">
                    <div>
                      <span className="caption--md color-gray">현재 투자원금</span>
                      <strong className="title--md">
                        {formatWon(limit.investedAmount)}
                      </strong>
                    </div>
                    <div className="tr">
                      <span className="caption--md color-gray">남은 한도</span>
                      <strong
                        className={`label--lg ${limit.remainingAmount < 0 ? "color-red" : ""}`}
                      >
                        {limit.yearlyLimit ? formatWon(limit.remainingAmount) : "-"}
                      </strong>
                    </div>
                  </div>
                  <div
                    className="invest-limit-card--progress"
                    role="progressbar"
                    aria-label={`${investmentAccountLabel[limit.accountType]} 사용률`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Number(
                      Math.min(Math.max(limit.usageRate, 0), 100).toFixed(1),
                    )}
                  >
                    <div
                      className="invest-limit-card--progress-fill"
                      style={{ width: `${Math.min(Math.max(limit.usageRate, 0), 100)}%` }}
                    />
                  </div>
                  <p className="caption--md color-gray tr">
                    {limit.yearlyLimit
                      ? `사용률 ${limit.usageRate.toFixed(1)}%`
                      : "한도를 입력해주세요."}
                  </p>
                  <div className="invest-limit-card--input row-group row-group--center row-group--gap-8">
                    <label className="main-overview--field">
                      <div className="row-group row-group--center row-group--gap-4">
                        <span className="caption--md color-gray">연간 한도</span>
                        <span className="caption--md">
                          {accountLimitInputs[limit.accountType]
                            ? `(${formatKoreanWon(parseFormattedNumber(accountLimitInputs[limit.accountType]))})`
                            : ""}
                        </span>
                      </div>

                      <input
                        className="main-overview--control body--sm"
                        type="text"
                        inputMode="numeric"
                        placeholder="한도 입력"
                        value={accountLimitInputs[limit.accountType]}
                        onChange={(event) =>
                          setAccountLimitInputs((prev) => ({
                            ...prev,
                            [limit.accountType]: formatIntegerInput(event.target.value),
                          }))
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="button button--outline button--xmd"
                      onClick={() => handleAccountLimitSave(limit.accountType)}
                    >
                      저장
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="invest-allocation column-group column-group--gap-8">
            <div>
              <h3 className="title--sm">포트폴리오 비중</h3>
              <p className="caption--lg color-gray">
                최근 거래일 종가 기준 평가금액으로 자산 구성을 보여줍니다.
              </p>
            </div>
            <div className="invest-allocation--grid">
              {portfolioAllocations.map((allocation) => (
                <article key={allocation.title} className="card invest-allocation-card">
                  <div className="row-group row-group--center row-group--between">
                    <h4 className="title--sm">{allocation.title}</h4>
                    {investmentTotals.isValuationReady ? (
                      <span
                        className={`badge ${allocationBadgeClassName[allocation.title] ?? "badge--teal"}`}
                      >
                        {allocation.items.length.toLocaleString()}개
                      </span>
                    ) : null}
                  </div>
                  {investmentTotals.isValuationReady && allocation.items.length ? (
                    <div className="invest-allocation-card--items">
                      {allocation.items.map((item) => (
                        <div key={item.key} className="invest-allocation-item">
                          <div className="invest-allocation-item--heading">
                            <div>
                              <strong className="label--md">{item.label}</strong>
                              <span className="caption--md color-gray">
                                {item.detail}
                              </span>
                            </div>
                            <div className="tr">
                              <strong className="label--md">
                                {item.rate.toFixed(1)}%
                              </strong>
                              <span className="caption--md color-gray">
                                {formatWon(item.currentValue)}
                              </span>
                            </div>
                          </div>
                          <div
                            className="invest-allocation-item--progress"
                            role="progressbar"
                            aria-label={`${item.label} 비중 ${item.rate.toFixed(1)}%`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Number(Math.min(Math.max(item.rate, 0), 100).toFixed(1))}
                          >
                            <div
                              className="invest-allocation-item--progress-fill"
                              style={{ width: `${Math.min(item.rate, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="invest-allocation-card--empty caption--md color-gray">
                      {investmentSummaries.length
                        ? "최근 종가 업데이트 후 비중을 표시합니다."
                        : "종목을 추가하면 비중을 표시합니다."}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>

          <div className={`invest-layout ${isStockPanelOpen ? "has-panel" : ""}`}>
            <section className="card invest-holdings column-group column-group--gap-16">
              <div className="main-overview--section-header row-group row-group--center row-group--between">
                <div>
                  <h3 className="main-overview--title title--sm">보유 종목</h3>
                  <p className="invest-section--description caption--lg">
                    금융위원회 데이터는 실시간이 아니며 최근 거래일 종가 기준입니다.
                    데이터는 일 1회 갱신되고, 기준일자로부터 영업일 하루 뒤 오후 1시 이후
                    업데이트됩니다.
                  </p>
                  <p className="invest-section--description caption--lg">
                    데이터 보유기관 연계 후 개방되는 정보라 실제 계좌 평가와 차이가 있을
                    수 있습니다. 금요일 데이터는 보통 다음 영업일에 제공됩니다.
                  </p>
                  {stockQuoteMessage ? (
                    <p className="invest-section--notice caption--lg">
                      {stockQuoteMessage}
                    </p>
                  ) : null}
                </div>
                <span className="badge badge--violet">
                  {investmentSummaries.length.toLocaleString()}개 보유
                </span>
              </div>
              <div className="table--wrap table--wrap__invest">
                <table className="table table--invest invest-holdings--table">
                  <thead>
                    <tr>
                      <th>
                        <div className="row-group row-group--center row-group--gap-4 first-th">
                          종목명
                          <button
                            type="button"
                            className="sort-btn"
                            aria-label="종목명 정렬"
                            onClick={() => handleStockSort("name")}
                          >
                            <AppIcon name="unfold_more" />
                          </button>
                        </div>
                      </th>
                      <th>최근 종가</th>
                      <th>
                        <div className="row-group row-group--center row-group--gap-4">
                          평가손익
                          <button
                            type="button"
                            className="sort-btn"
                            aria-label="총 수익 정렬"
                            onClick={() => handleStockSort("totalProfit")}
                          >
                            <AppIcon name="unfold_more" />
                          </button>
                        </div>
                      </th>
                      <th>
                        <div className="row-group row-group--center row-group--gap-4">
                          매입 / 평가
                          <button
                            type="button"
                            className="sort-btn"
                            aria-label="총 금액 정렬"
                            onClick={() => handleStockSort("totalCost")}
                          >
                            <AppIcon name="unfold_more" />
                          </button>
                        </div>
                      </th>
                      <th>
                        <div className="row-group row-group--center row-group--gap-4">
                          전일 대비
                          <button
                            type="button"
                            className="sort-btn"
                            aria-label="전일 대비 정렬"
                            onClick={() => handleStockSort("dailyProfit")}
                          >
                            <AppIcon name="unfold_more" />
                          </button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {investmentSummaries.length ? (
                      investmentSummaries.map((stock) => {
                        const totalProfitClassName = stock.hasQuote
                          ? getChangeClassName(stock.totalProfit)
                          : "color-gray";
                        const dailyProfitClassName = stock.hasQuote
                          ? getChangeClassName(stock.dailyProfit)
                          : "color-gray";

                        return (
                          <tr
                            key={stock.groupKey}
                            className={
                              selectedSummary?.groupKey === stock.groupKey
                                ? "is-selected"
                                : ""
                            }
                            onClick={() => setSelectedGroupKey(stock.groupKey)}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter" && event.key !== " ") return;
                              event.preventDefault();
                              setSelectedGroupKey(stock.groupKey);
                            }}
                            role="button"
                            tabIndex={0}
                            aria-pressed={selectedSummary?.groupKey === stock.groupKey}
                          >
                            <td className="tl">
                              <div className="invest-holdings--select column-group column-group--gap-4">
                                <p className="label--lg">{stock.name}</p>
                                <span className="caption--md color-gray">
                                  {stock.symbol} · {stock.market} ·{" "}
                                  {stock.quantity.toLocaleString()}주
                                </span>
                                <span className="badge badge--blue caption--md">
                                  {investmentAccountLabel[stock.accountType]}
                                </span>
                              </div>
                            </td>
                            <td className="tr">
                              <p className="label--lg">
                                {stock.hasQuote ? formatWon(stock.currentPrice) : "-"}
                              </p>
                              <span className="caption--md color-gray">
                                평균 {formatWon(stock.averagePrice)}
                              </span>
                            </td>
                            <td className="tr">
                              <p className={`label--lg ${totalProfitClassName}`}>
                                {stock.hasQuote
                                  ? formatSignedPercent(stock.totalProfitRate)
                                  : "-"}
                              </p>
                              <span className={`caption--md ${totalProfitClassName}`}>
                                {stock.hasQuote
                                  ? formatSignedWon(stock.totalProfit)
                                  : "조회 전"}
                              </span>
                            </td>
                            <td className="tr">
                              <p className="label--lg">{formatWon(stock.totalCost)}</p>
                              <span className="caption--md color-gray">
                                평가{" "}
                                {stock.hasQuote ? formatWon(stock.currentValue) : "-"}
                              </span>
                            </td>
                            <td className="tr">
                              <p className={`label--lg ${dailyProfitClassName}`}>
                                {stock.hasQuote
                                  ? formatSignedPercent(stock.dailyProfitRate)
                                  : "-"}
                              </p>
                              <span className={`caption--md ${dailyProfitClassName}`}>
                                {stock.hasQuote
                                  ? formatSignedWon(stock.dailyProfit)
                                  : "조회 전"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="invest-empty" colSpan={5}>
                          등록된 주식이 없습니다. 종목을 추가해 투자 현황을 확인해보세요.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {selectedSummary ? (
                <section className="invest-detail column-group column-group--gap-16">
                  <div className="invest-detail--header row-group row-group--center row-group--between">
                    <div>
                      <h4 className="title--sm">{selectedSummary.name}</h4>
                      <p className="caption--md color-gray">
                        {selectedSummary.symbol} · {selectedSummary.market} ·{" "}
                        {investmentAccountLabel[selectedSummary.accountType]}
                      </p>
                    </div>
                    <span className="badge badge--blue">
                      보유 기록 {selectedPurchaseRecords.length}건
                    </span>
                  </div>
                  <div className="invest-detail--daily">
                    <div>
                      <span className="caption--md color-gray">최근 종가</span>
                      <strong className="title--md">
                        {selectedSummary.hasQuote
                          ? formatWon(selectedSummary.currentPrice)
                          : "-"}
                      </strong>
                    </div>
                    <div className="tr">
                      <span className="caption--md color-gray">전일 대비</span>
                      <strong
                        className={`label--lg ${
                          selectedSummary.hasQuote
                            ? getChangeClassName(selectedSummary.dailyProfit)
                            : "color-gray"
                        }`}
                      >
                        {selectedSummary.hasQuote
                          ? `${formatSignedWon(selectedSummary.dailyProfit)} (${formatSignedPercent(selectedSummary.dailyProfitRate)})`
                          : "최근 종가 업데이트 후 표시"}
                      </strong>
                    </div>
                  </div>
                  <div className="invest-detail--metrics">
                    <div>
                      <span className="caption--md color-gray">보유 수량</span>
                      <strong className="label--lg">
                        {selectedSummary.quantity.toLocaleString()}주
                      </strong>
                    </div>
                    <div>
                      <span className="caption--md color-gray">평균 매입가</span>
                      <strong className="label--lg">
                        {formatWon(selectedSummary.averagePrice)}
                      </strong>
                    </div>
                    <div>
                      <span className="caption--md color-gray">평가금액</span>
                      <strong className="label--lg">
                        {selectedSummary.hasQuote
                          ? formatWon(selectedSummary.currentValue)
                          : "-"}
                      </strong>
                    </div>
                    <div>
                      <span className="caption--md color-gray">평가손익</span>
                      <strong
                        className={`label--lg ${selectedSummary.hasQuote ? getChangeClassName(selectedSummary.totalProfit) : ""}`}
                      >
                        {selectedSummary.hasQuote
                          ? formatSignedWon(selectedSummary.totalProfit)
                          : "-"}
                      </strong>
                    </div>
                  </div>
                  <div className="invest-detail--purchases column-group column-group--gap-8">
                    {selectedPurchaseRecords.map((stock) => (
                      <article key={stock.id} className="invest-detail--purchase">
                        <div className="invest-detail--purchase-copy">
                          <strong className="label--md">
                            {stock.purchaseDate || "구매일 미입력"}
                          </strong>
                          <span className="caption--md color-gray">
                            {stock.quantity.toLocaleString()}주 ·{" "}
                            {formatWon(stock.unitPrice)} ·{" "}
                            {formatWon(stock.quantity * stock.unitPrice)}
                          </span>
                          {stock.memo ? (
                            <span className="caption--md color-gray">{stock.memo}</span>
                          ) : null}
                        </div>
                        <div className="row-group row-group--center row-group--gap-4">
                          <button
                            type="button"
                            className="button button--outline button--xs"
                            onClick={() => startStockEdit(stock)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="button button--negative button--outline button--xs"
                            onClick={() => handleStockDelete(stock)}
                            disabled={deletingStockId === stock.id}
                          >
                            {deletingStockId === stock.id ? "삭제 중" : "삭제"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </section>

            {isStockPanelOpen ? (
              <aside className="card invest-editor column-group column-group--gap-16">
                <div className="main-overview--section-header row-group row-group--center row-group--between">
                  <div>
                    <h3 className="main-overview--title title--sm">
                      {editingStockId ? "보유 기록 수정" : "종목 추가"}
                    </h3>
                    <p className="caption--md invest-section--description">
                      {editingStockId
                        ? "선택한 보유 기록을 변경합니다."
                        : "현재 보유 중인 종목을 기록합니다."}
                    </p>
                  </div>
                  <span className="badge badge--green">KRW</span>
                </div>
                {editingStockId ? (
                  <button
                    type="button"
                    className="button button--outline button--sm button--full"
                    onClick={startStockCreate}
                  >
                    새 종목 추가로 전환
                  </button>
                ) : null}
                <div className="main-overview--form">
                  <label className="main-overview--field">
                    <span className="label--md">종목 검색</span>
                    <div className="autocomplete">
                      <div className="autocomplete__control">
                        <input
                          className="autocomplete__input"
                          type="text"
                          placeholder="종목명 또는 코드"
                          aria-label="종목 검색"
                          value={stockQuery}
                          onChange={(event) => {
                            setStockQuery(event.target.value);
                            setSelectedStock(null);
                          }}
                          onCompositionStart={() => setIsStockQueryComposing(true)}
                          onCompositionEnd={(event) => {
                            setIsStockQueryComposing(false);
                            setStockQuery(event.currentTarget.value);
                          }}
                        />
                        <AppIcon name="arrow_drop_down" className="autocomplete__icon" />
                      </div>
                      {stockSearchItems.length || isStockSearching ? (
                        <ul className="autocomplete__list">
                          {isStockSearching ? (
                            <li className="autocomplete__item label--md">검색 중...</li>
                          ) : (
                            stockSearchItems.map((stock) => (
                              <li key={`${stock.market}-${stock.symbol}`}>
                                <button
                                  type="button"
                                  className="autocomplete__item"
                                  onClick={() => {
                                    setSelectedStock(stock);
                                    setStockQuery(`${stock.name} (${stock.symbol})`);
                                    setStockSearchItems([]);
                                  }}
                                >
                                  <span className="label--md">{stock.name}</span>
                                  <span className="caption--md color-gray">
                                    {stock.symbol} · {stock.market}
                                  </span>
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      ) : null}
                    </div>
                  </label>
                  <label className="main-overview--field">
                    <span className="label--md">계좌 구분</span>
                    <select
                      className="main-overview--control body--sm"
                      value={stockAccountType}
                      onChange={(event) =>
                        setStockAccountType(event.target.value as InvestmentAccountType)
                      }
                    >
                      <option value="GENERAL">일반계좌</option>
                      <option value="ISA">ISA</option>
                      <option value="PENSION">연금저축</option>
                    </select>
                  </label>
                  <label className="main-overview--field">
                    <span className="label--md">구매일 (선택)</span>
                    <input
                      className="main-overview--control body--sm"
                      type="date"
                      value={stockPurchaseDate}
                      onChange={(event) => setStockPurchaseDate(event.target.value)}
                    />
                  </label>
                  <div className="grid-col-2">
                    <label className="main-overview--field">
                      <span className="label--md">수량</span>
                      <input
                        className="main-overview--control body--sm"
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={stockQuantity}
                        onChange={(event) =>
                          setStockQuantity(formatDecimalInput(event.target.value, 6))
                        }
                      />
                    </label>
                    <label className="main-overview--field">
                      <span className="label--md">평균 매입단가</span>
                      <input
                        className="main-overview--control body--sm"
                        type="text"
                        inputMode="decimal"
                        placeholder="1주 단가"
                        value={stockUnitPrice}
                        onChange={(event) =>
                          setStockUnitPrice(formatDecimalInput(event.target.value, 2))
                        }
                      />
                    </label>
                  </div>
                  <label className="main-overview--field">
                    <span className="label--md">메모</span>
                    <input
                      className="main-overview--control body--sm"
                      type="text"
                      placeholder="선택 입력"
                      value={stockMemo}
                      onChange={(event) => setStockMemo(event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="button button--primary button--md button--full main-overview--submit"
                    onClick={handleStockSubmit}
                    disabled={isStockSubmitting}
                  >
                    {isStockSubmitting
                      ? "저장 중..."
                      : editingStockId
                        ? "수정 저장"
                        : "종목 추가"}
                  </button>
                </div>
              </aside>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
