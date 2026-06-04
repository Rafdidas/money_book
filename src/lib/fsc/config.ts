type FscConfig = {
  serviceKey: string;
  baseUrl: string;
};

const DEFAULT_FSC_STOCK_BASE_URL =
  "https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService";
const DEFAULT_FSC_SECURITIES_PRODUCT_BASE_URL =
  "https://apis.data.go.kr/1160100/service/GetSecuritiesProductInfoService";

const readRequiredEnv = (name: string) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
};

export const getFscConfig = (): FscConfig => ({
  serviceKey: readRequiredEnv("FSC_STOCK_SERVICE_KEY"),
  baseUrl: process.env.FSC_STOCK_BASE_URL?.trim() || DEFAULT_FSC_STOCK_BASE_URL,
});

export const getFscSecuritiesProductConfig = (): FscConfig => ({
  serviceKey: readRequiredEnv("FSC_SECURITIES_PRODUCT_SERVICE_KEY"),
  baseUrl:
    process.env.FSC_SECURITIES_PRODUCT_BASE_URL?.trim() ||
    DEFAULT_FSC_SECURITIES_PRODUCT_BASE_URL,
});
