const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://monibuk.com";

export const siteUrl = new URL(rawSiteUrl.endsWith("/") ? rawSiteUrl : `${rawSiteUrl}/`);
export const siteName = "머니북가계부";
export const siteTitle = "머니북가계부 | 무료가계부";
export const siteDescription =
  "수입, 지출, 저축, 투자 기록을 월별 대시보드와 분석 차트로 관리하는 무료 온라인 개인 가계부 서비스입니다.";

export const siteKeywords = [
  "가계부",
  "무료 가계부",
  "개인 가계부",
  "온라인 가계부",
  "수입 지출 관리",
  "월별 지출 분석",
  "저축 관리",
  "고정지출 관리",
  "투자 기록",
  "Money Book",
  "머니북",
  "머니북가계부",
  "가계부",
  "인터넷가계부",
  "무료가계부",
  "가계부프로그램",
  "회계",
  "가계부서비스",
  "가계부어플",
  "자산관리",
  "가계부항목",
  "전자가계부",
];

export const getSiteUrl = (path = "/") => new URL(path, siteUrl).toString();
