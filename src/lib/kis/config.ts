type KisConfig = {
  appKey: string;
  appSecret: string;
  baseUrl: string;
};

const DEFAULT_KIS_BASE_URL = "https://openapi.koreainvestment.com:9443";

const readRequiredEnv = (name: string) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
};

export const getKisConfig = (): KisConfig => ({
  appKey: readRequiredEnv("KIS_APP_KEY"),
  appSecret: readRequiredEnv("KIS_APP_SECRET"),
  baseUrl: process.env.KIS_BASE_URL?.trim() || DEFAULT_KIS_BASE_URL,
});

export const hasKisConfig = () =>
  Boolean(process.env.KIS_APP_KEY?.trim() && process.env.KIS_APP_SECRET?.trim());
