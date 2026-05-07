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
