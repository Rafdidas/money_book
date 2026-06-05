export type StockSearchItem = {
  symbol: string;
  name: string;
  market: string;
};

export type StockQuote = {
  symbol: string;
  currentPrice: number;
  dailyChange: number;
  dailyChangeRate: number;
  baseDate?: string;
  updatedAt: string;
};

export type StockPurchaseMeta = {
  symbol: string;
  name: string;
  market: string;
  quantity: number;
  unitPrice: number;
  purchaseDate: string;
};

export type InvestmentAccountType = "GENERAL" | "ISA" | "PENSION";
export type InvestmentCurrency = "KRW";
export type LimitAccountType = Extract<InvestmentAccountType, "ISA" | "PENSION">;
export type InvestmentAccountLimits = Record<LimitAccountType, number>;

export type InvestmentStock = StockPurchaseMeta & {
  id: string;
  createdAt: string;
  accountType: InvestmentAccountType;
  currency: InvestmentCurrency;
  memo: string;
};
