const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://monibuk.com";

export const siteUrl = new URL(rawSiteUrl.endsWith("/") ? rawSiteUrl : `${rawSiteUrl}/`);
export const siteName = "머니북가계부";
export const siteTitle = "머니북가계부 | 무료가계부";
export const siteDescription =
  "수입, 지출, 저축, 투자 내역을 기록하고 월별 대시보드와 분석 차트로 소비 흐름을 확인할 수 있는 무료 온라인 개인 가계부 서비스입니다.";

export const siteKeywords = [
  "가계부",
  "무료 가계부",
  "개인 가계부",
  "온라인 가계부",
  "웹 가계부",
  "인터넷 가계부",
  "수입 지출 관리",
  "월별 지출 관리",
  "고정지출 관리",
  "저축 관리",
  "투자 기록",
  "투자 관리",
  "주식 투자 관리",
  "주식 포트폴리오 관리",
  "주식 수익률 계산",
  "보유 종목 관리",
  "ISA 투자 관리",
  "연금저축 투자 관리",
  "자산 관리",
  "가계부 프로그램",
  "가계부 추천",
  "가계부 쓰는 법",
  "머니북",
  "머니북 가계부",
  "Money Book",
];

export const getSiteUrl = (path = "/") => new URL(path, siteUrl).toString();
