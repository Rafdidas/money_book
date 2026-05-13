"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SideMenu from "@/components/common/SideMenu";
import { useAppData } from "@/app/providers";
import { DEMO_USER_ID, writeDemoExpenses } from "@/lib/demo";
import { createExpense } from "@/lib/api/expense";
import type { Expense } from "@/types/expense";
import type { StockPurchaseMeta, StockQuote, StockSearchItem } from "@/types/stock";
import { formatDate } from "@/utils/date";
import "../../invest/invest.scss";

const formatWon = (value: number) =>
  `${value < 0 ? "-" : ""}${Math.round(Math.abs(value)).toLocaleString()}원`;
const stockCategory = "📈주식";
const stockMetaPrefix = "[[stock:";
const stockMetaPattern = /\s*\[\[stock:([^\]]+)\]\]\s*$/;
const stockAutoRefreshKey = "money-book-stock-last-refresh";

type ExpenseFormData = Pick<Expense, "amount" | "category" | "memo" | "date" | "type">;
type StockSortKey = "name" | "totalProfit" | "averagePrice" | "totalCost" | "dailyProfit";
type SortDirection = "asc" | "desc";
type StockSort = {
  key: StockSortKey;
  direction: SortDirection;
} | null;

type InvestmentStock = StockPurchaseMeta & {
  id: string;
  createdAt: string;
};

type InvestmentSummary = {
  symbol: string;
  name: string;
  market: string;
  quantity: number;
  totalCost: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  totalProfit: number;
  totalProfitRate: number;
  dailyProfit: number;
  dailyProfitRate: number;
};

const encodeStockMemo = (meta: StockPurchaseMeta) =>
  `${meta.name} ${stockMetaPrefix}${encodeURIComponent(JSON.stringify(meta))}]]`;

const parseStockMemo = (memo: string): StockPurchaseMeta | null => {
  const match = memo.match(stockMetaPattern);
  if (!match) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as Partial<StockPurchaseMeta>;
    if (
      typeof parsed.symbol !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.market !== "string" ||
      typeof parsed.quantity !== "number" ||
      typeof parsed.unitPrice !== "number" ||
      typeof parsed.purchaseDate !== "string"
    ) {
      return null;
    }
    return {
      symbol: parsed.symbol,
      name: parsed.name,
      market: parsed.market,
      quantity: parsed.quantity,
      unitPrice: parsed.unitPrice,
      purchaseDate: parsed.purchaseDate,
    };
  } catch {
    return null;
  }
};

const isStockItem = (item: Expense) =>
  item.type === "expense" && item.category === stockCategory && Boolean(parseStockMemo(item.memo));
const getChangeClassName = (value: number) =>
  value > 0 ? "color-red" : value < 0 ? "color-blue" : "color-gray";
const formatSignedPercent = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
const formatSignedWon = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "-" : ""}${Math.round(Math.abs(value)).toLocaleString()}원`;
const shouldRefreshStockQuotes = () => {
  if (typeof window === "undefined") return false;
  const lastRefresh = Number(window.localStorage.getItem(stockAutoRefreshKey) || 0);
  if (!lastRefresh) return true;
  return Date.now() - lastRefresh >= 1000 * 60 * 60 * 12;
};

export default function InvestPage() {
  const today = useMemo(() => new Date(), []);
  const {
    expenses,
    setExpenses,
    displayName,
    displayEmail,
    isDemoMode,
    isAuthResolved,
  } = useAppData();
  const [selectedDate, setSelectedDate] = useState(today);
  const [stockQuery, setStockQuery] = useState("");
  const [stockSearchItems, setStockSearchItems] = useState<StockSearchItem[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockSearchItem | null>(null);
  const [stockPurchaseDate, setStockPurchaseDate] = useState(formatDate(today));
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockUnitPrice, setStockUnitPrice] = useState("");
  const [stockQuotes, setStockQuotes] = useState<Record<string, StockQuote>>({});
  const [stockSort, setStockSort] = useState<StockSort>(null);
  const [isStockSearching, setIsStockSearching] = useState(false);
  const [isStockSubmitting, setIsStockSubmitting] = useState(false);
  const [isStockRefreshing, setIsStockRefreshing] = useState(false);

  const investmentStocks = useMemo<InvestmentStock[]>(
    () =>
      expenses
        .map((item) => {
          if (!isStockItem(item)) return null;
          const meta = parseStockMemo(item.memo);
          if (!meta) return null;
          return {
            ...meta,
            id: item.id,
            createdAt: item.created_at,
          };
        })
        .filter((item): item is InvestmentStock => Boolean(item)),
    [expenses],
  );
  const investmentSummaries = useMemo<InvestmentSummary[]>(() => {
    const grouped = investmentStocks.reduce<Record<string, InvestmentSummary>>((acc, stock) => {
      const quote = stockQuotes[stock.symbol];
      const totalCost = stock.quantity * stock.unitPrice;

      if (!acc[stock.symbol]) {
        acc[stock.symbol] = {
          symbol: stock.symbol,
          name: stock.name,
          market: stock.market,
          quantity: 0,
          totalCost: 0,
          averagePrice: 0,
          currentPrice: quote?.currentPrice ?? 0,
          currentValue: 0,
          totalProfit: 0,
          totalProfitRate: 0,
          dailyProfit: 0,
          dailyProfitRate: 0,
        };
      }

      acc[stock.symbol].quantity += stock.quantity;
      acc[stock.symbol].totalCost += totalCost;
      acc[stock.symbol].currentPrice = quote?.currentPrice ?? acc[stock.symbol].currentPrice;
      acc[stock.symbol].dailyProfitRate = quote?.dailyChangeRate ?? acc[stock.symbol].dailyProfitRate;
      acc[stock.symbol].dailyProfit += (quote?.dailyChange ?? 0) * stock.quantity;

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

  const resetStockForm = useCallback(() => {
    setStockQuery("");
    setStockSearchItems([]);
    setSelectedStock(null);
    setStockPurchaseDate(formatDate(selectedDate));
    setStockQuantity("");
    setStockUnitPrice("");
  }, [selectedDate]);

  const refreshStockQuotes = useCallback(async (symbols = stockSymbols) => {
    if (!symbols.length || isDemoMode || !displayEmail) return;

    try {
      setIsStockRefreshing(true);
      const response = await fetch("/api/stocks/quotes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ symbols }),
      });
      const data = (await response.json()) as {
        quotes?: StockQuote[];
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "현재가 업데이트에 실패했습니다.");
      }

      setStockQuotes((prev) => ({
        ...prev,
        ...(data.quotes || []).reduce<Record<string, StockQuote>>((acc, quote) => {
          acc[quote.symbol] = quote;
          return acc;
        }, {}),
      }));
      window.localStorage.setItem(stockAutoRefreshKey, String(Date.now()));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "현재가 업데이트 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsStockRefreshing(false);
    }
  }, [displayEmail, isDemoMode, stockSymbols]);

  const handleStockSort = (key: StockSortKey) => {
    setStockSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const handleStockSubmit = async () => {
    const quantity = Number(stockQuantity);
    const unitPrice = Number(stockUnitPrice);
    const purchaseDate = new Date(`${stockPurchaseDate}T00:00:00`);

    if (!selectedStock) {
      alert("종목을 선택해주세요.");
      return;
    }
    if (!stockPurchaseDate || Number.isNaN(purchaseDate.getTime())) {
      alert("구매일을 선택해주세요.");
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

    const meta: StockPurchaseMeta = {
      ...selectedStock,
      quantity,
      unitPrice,
      purchaseDate: stockPurchaseDate,
    };
    const payload: ExpenseFormData = {
      amount: quantity * unitPrice,
      category: stockCategory,
      memo: encodeStockMemo(meta),
      date: stockPurchaseDate,
      type: "expense",
    };

    try {
      setIsStockSubmitting(true);

      if (isDemoMode) {
        const demoExpense: Expense = {
          id: `demo-stock-${selectedStock.symbol}-${Date.now()}`,
          user_id: DEMO_USER_ID,
          created_at: new Date().toISOString(),
          ...payload,
        };
        setExpenses((prev) => {
          const next = [demoExpense, ...prev];
          writeDemoExpenses(next);
          return next;
        });
      } else {
        const saved = await createExpense(payload);
        setExpenses((prev) => [...prev, ...(saved || [])]);
        await refreshStockQuotes([selectedStock.symbol]);
      }

      setSelectedDate(new Date(`${stockPurchaseDate}T00:00:00`));
      resetStockForm();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "주식 저장 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsStockSubmitting(false);
    }
  };

  useEffect(() => {
    const query = stockQuery.trim();
    if (query.length < 2 || selectedStock?.name === query || selectedStock?.symbol === query) {
      setStockSearchItems([]);
      setIsStockSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsStockSearching(true);
        const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as {
          items?: StockSearchItem[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message || "종목 검색에 실패했습니다.");
        }
        setStockSearchItems(data.items || []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStockSearchItems([]);
      } finally {
        setIsStockSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [selectedStock, stockQuery]);

  useEffect(() => {
    if (!isAuthResolved || isDemoMode || !displayEmail || !stockSymbols.length) return;
    if (!shouldRefreshStockQuotes()) return;
    refreshStockQuotes();
  }, [displayEmail, isAuthResolved, isDemoMode, refreshStockQuotes, stockSymbols.length]);

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
      <main className="main column-group">
        <section className="main-header row-group row-group--center row-group--between">
          <h2 className="main-header--title headline--sm">투자</h2>
        </section>
        <section className="column-group column-group--gap-16">
          <div className="main-overview column-group column-group--gap-16">
            <h3 className="main-common-title title--md">주식</h3>
            <div className="main-overview--invest card overview-card column-group column-group--top column-group--gap-8">
              <div className="column-group column-group--gap-16">
                <div className="main-overview--section-header row-group row-group--center row-group--between">
                  <h4 className="main-overview--title title--sm">주식</h4>
                  <div className="row-group row-group-center row-group--gap-4">
                    <button
                      type="button"
                      className="button refresh-btn"
                      aria-label="주식 현재가 새로고침"
                      onClick={() => refreshStockQuotes()}
                      disabled={isStockRefreshing || !stockSymbols.length || isDemoMode}
                    >
                      <span className="material-symbols-outlined " aria-hidden="true">
                        refresh
                      </span>
                      정보 업데이트
                    </button>
                    <div
                      className="main-overview--tabs"
                      role="tablist"
                      aria-label="내역 입력 모드"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected="true"
                        className="main-overview--tab bodyBold--sm is-active"
                      >
                        추가
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected="false"
                        className="main-overview--tab bodyBold--sm"
                        disabled
                      >
                        수정
                      </button>
                    </div>
                  </div>
                </div>
                <div className="main-overview--form">
                  <div className="grid-col-2">
                    <label className="main-overview--field">
                      <span className="label--md">종목 검색</span>
                      <div className="autocomplete" data-node-id="20805:11748">
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
                          />
                          <span
                            className="material-symbols-outlined autocomplete__icon"
                            aria-hidden="true"
                          >
                            arrow_drop_down
                          </span>
                        </div>
                        {stockSearchItems.length || isStockSearching ? (
                          <ul className="autocomplete__list">
                            {isStockSearching ? (
                              <li className="autocomplete__item label--md">
                                검색 중...
                              </li>
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
                      <span className="label--md">구매일</span>
                      <input
                        className="main-overview--control body--sm"
                        type="date"
                        value={stockPurchaseDate}
                        onChange={(event) => setStockPurchaseDate(event.target.value)}
                      />
                    </label>
                  </div>
                  <div className="grid-col-2">
                    <label className="main-overview--field">
                      <span className="label--md">수량</span>
                      <input
                        className="main-overview--control body--sm"
                        type="number"
                        min="0"
                        step="0.000001"
                        placeholder="0"
                        value={stockQuantity}
                        onChange={(event) => setStockQuantity(event.target.value)}
                      />
                    </label>
                    <label className="main-overview--field">
                      <span className="label--md">평균 매입단가</span>
                      <input
                        className="main-overview--control body--sm"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="1주 평균 매입단가"
                        value={stockUnitPrice}
                        onChange={(event) => setStockUnitPrice(event.target.value)}
                      />
                    </label>
                  </div>
                  <div className="main-overview--actions row-group row-group--center row-group--gap-8">
                    <button
                      type="button"
                      className="button button--primary button--md button--full main-overview--submit"
                      onClick={handleStockSubmit}
                      disabled={isStockSubmitting}
                    >
                      {isStockSubmitting ? "저장 중..." : "주식 추가"}
                    </button>
                  </div>
                </div>

                <div className="table--wrap table--wrap__invest">
                  <table className="table table--invest">
                    <thead>
                      <tr>
                        <th>
                          <div className="row-group row-group--center row-group--gap-4 first-th">
                            종목명
                            <button
                              type="button"
                              className="material-symbols-outlined sort-btn"
                              aria-label="종목명 정렬"
                              onClick={() => handleStockSort("name")}
                            >
                              unfold_more
                            </button>
                          </div>
                        </th>
                        <th>
                          <div className="row-group row-group--center row-group--gap-4">
                            총 수익
                            <button
                              type="button"
                              className="material-symbols-outlined sort-btn"
                              aria-label="총 수익 정렬"
                              onClick={() => handleStockSort("totalProfit")}
                            >
                              unfold_more
                            </button>
                          </div>
                        </th>
                        <th>
                          <div className="row-group row-group--center row-group--gap-4">
                            1주 평균 금액
                            <button
                              type="button"
                              className="material-symbols-outlined sort-btn"
                              aria-label="1주 평균 금액 정렬"
                              onClick={() => handleStockSort("averagePrice")}
                            >
                              unfold_more
                            </button>
                          </div>
                        </th>
                        <th>
                          <div className="row-group row-group--center row-group--gap-4">
                            총 금액
                            <button
                              type="button"
                              className="material-symbols-outlined sort-btn"
                              aria-label="총 금액 정렬"
                              onClick={() => handleStockSort("totalCost")}
                            >
                              unfold_more
                            </button>
                          </div>
                        </th>
                        <th>
                          <div className="row-group row-group--center row-group--gap-4">
                            일간 수익
                            <button
                              type="button"
                              className="material-symbols-outlined sort-btn"
                              aria-label="일간 수익 정렬"
                              onClick={() => handleStockSort("dailyProfit")}
                            >
                              unfold_more
                            </button>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {investmentSummaries.length ? (
                        investmentSummaries.map((stock) => {
                          const totalProfitClassName = getChangeClassName(
                            stock.totalProfit,
                          );
                          const dailyProfitClassName = getChangeClassName(
                            stock.dailyProfit,
                          );

                          return (
                            <tr key={stock.symbol}>
                              <td className="tl">
                                <div className="column-group column-group--gap-4">
                                  <p className="label--lg">{stock.name}</p>
                                  <span className="caption--md color-gray">
                                    {stock.quantity.toLocaleString()}주 · {stock.symbol}
                                  </span>
                                </div>
                              </td>
                              <td className="tr">
                                <div className="column-group column-group--gap-4">
                                  <p className={`label--lg ${totalProfitClassName}`}>
                                    {formatSignedPercent(stock.totalProfitRate)}
                                  </p>
                                  <span
                                    className={`caption--md ${totalProfitClassName}`}
                                  >
                                    {formatSignedWon(stock.totalProfit)}
                                  </span>
                                </div>
                              </td>
                              <td className="tr">
                                <div className="column-group column-group--gap-4">
                                  <p className="label--lg">
                                    {formatWon(stock.averagePrice)}
                                  </p>
                                  <span className="caption--md color-gray">
                                    현재가 {formatWon(stock.currentPrice)}
                                  </span>
                                </div>
                              </td>
                              <td className="tr">
                                <div className="column-group column-group--gap-4">
                                  <p className="label--lg">
                                    {formatWon(stock.totalCost)}
                                  </p>
                                  <span className="caption--md color-gray">
                                    평가 {formatWon(stock.currentValue)}
                                  </span>
                                </div>
                              </td>
                              <td className="tr">
                                <div className="column-group column-group--gap-4">
                                  <p className={`label--lg ${dailyProfitClassName}`}>
                                    {formatSignedPercent(stock.dailyProfitRate)}
                                  </p>
                                  <span
                                    className={`caption--md ${dailyProfitClassName}`}
                                  >
                                    {formatSignedWon(stock.dailyProfit)}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5}>등록된 주식이 없습니다.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="empty title--md">업데이트 예정</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
