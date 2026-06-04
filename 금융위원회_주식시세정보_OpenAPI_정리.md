# 금융위원회_주식시세정보 OpenAPI 정리

> 원본 문서: `오픈API 활용자가이드_금융위원회_주식시세정보.docx`  
> 서비스명: 금융위원회_주식시세정보  
> API 영문명: `getStockSecuritiesInfoService`  
> 제공기관 데이터: 한국거래소 KRX 상장 시세 정보  
> 데이터 갱신주기: 일 1회  
> 통신 방식: REST GET  
> 응답 형식: XML / JSON

---

## 1. API 개요

`금융위원회_주식시세정보` API는 한국거래소에서 제공하는 시세 정보를 조회할 수 있는 공공데이터 OpenAPI이다.

제공 범위는 다음과 같다.

- 주식시세
- 수익증권시세
- 신주인수권증권시세
- 신주인수권증서시세

해외주식 시세는 제공하지 않는다.

---

## 2. 기본 정보

| 항목 | 내용 |
|---|---|
| API명 | 금융위원회_주식시세정보 |
| API 영문명 | `getStockSecuritiesInfoService` |
| 서비스 URL | `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService` |
| 인증 방식 | `serviceKey` |
| 통신 방식 | REST GET |
| 응답 형식 | XML, JSON |
| 데이터 갱신주기 | 일 1회 |
| 서비스 시작일 | 2021-11-16 |
| 서비스 버전 | 1.0 |

---

## 3. 제공 기능 목록

| 번호 | 기능명 | 영문 기능명 | 설명 |
|---:|---|---|---|
| 1 | 주식시세 | `getStockPriceInfo` | KRX에 상장된 주식의 시세 정보 |
| 2 | 신주인수권증서시세 | `getPreemptiveRightCertificatePriceInfo` | KRX에 상장된 신주인수권증서 시세 정보 |
| 3 | 수익증권시세 | `getSecuritiesPriceInfo` | KRX에 상장된 수익증권 시세 정보 |
| 4 | 신주인수권증권시세 | `getPreemptiveRightSecuritiesPriceInfo` | KRX에 상장된 신주인수권증권 시세 정보 |

---

# 4. 주식시세 API

## 4.1 기능 개요

| 항목 | 내용 |
|---|---|
| 기능명 | 주식시세 |
| 영문명 | `getStockPriceInfo` |
| 설명 | KRX에 상장된 주식의 시세 정보를 제공 |
| 호출 URL | `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo` |
| 평균 응답 시간 | 500ms |
| 초당 최대 트랜잭션 | 30 TPS |

---

## 4.2 요청 파라미터

| 파라미터 | 설명 | 필수 여부 | 예시 |
|---|---|---:|---|
| `serviceKey` | 공공데이터포털에서 발급받은 인증키 | 필수 | 인증키 |
| `numOfRows` | 한 페이지 결과 수 | 필수 | `10` |
| `pageNo` | 페이지 번호 | 필수 | `1` |
| `resultType` | 결과 형식. `xml` 또는 `json` | 필수 | `json` |
| `basDt` | 기준일자와 정확히 일치하는 데이터 검색 | 선택 | `20220919` |
| `beginBasDt` | 기준일자가 검색값보다 크거나 같은 데이터 검색 | 선택 | `20220919` |
| `endBasDt` | 기준일자가 검색값보다 작은 데이터 검색 | 선택 | `20220919` |
| `likeBasDt` | 기준일자가 검색값을 포함하는 데이터 검색 | 선택 | `202209` |
| `likeSrtnCd` | 단축코드가 검색값을 포함하는 데이터 검색 | 선택 | `005930` |
| `isinCd` | ISIN 코드와 정확히 일치하는 데이터 검색 | 선택 | `KR7005930003` |
| `likeIsinCd` | ISIN 코드가 검색값을 포함하는 데이터 검색 | 선택 | `KR700593` |
| `itmsNm` | 종목명과 정확히 일치하는 데이터 검색 | 선택 | `삼성전자` |
| `likeItmsNm` | 종목명이 검색값을 포함하는 데이터 검색 | 선택 | `삼성` |
| `mrktCls` | 시장구분과 일치하는 데이터 검색 | 선택 | `KOSPI` |
| `beginVs` | 전일 대비가 검색값보다 크거나 같은 데이터 검색 | 선택 | `-8` |
| `endVs` | 전일 대비가 검색값보다 작은 데이터 검색 | 선택 | `-8` |
| `beginFltRt` | 등락률이 검색값보다 크거나 같은 데이터 검색 | 선택 | `-4.57` |
| `endFltRt` | 등락률이 검색값보다 작은 데이터 검색 | 선택 | `-4.57` |
| `beginTrqu` | 거래량이 검색값보다 크거나 같은 데이터 검색 | 선택 | `2788311` |
| `endTrqu` | 거래량이 검색값보다 작은 데이터 검색 | 선택 | `2788311` |
| `beginTrPrc` | 거래대금이 검색값보다 크거나 같은 데이터 검색 | 선택 | `475708047` |
| `endTrPrc` | 거래대금이 검색값보다 작은 데이터 검색 | 선택 | `475708047` |
| `beginLstgStCnt` | 상장주식수가 검색값보다 크거나 같은 데이터 검색 | 선택 | `219932050` |
| `endLstgStCnt` | 상장주식수가 검색값보다 작은 데이터 검색 | 선택 | `219932050` |
| `beginMrktTotAmt` | 시가총액이 검색값보다 크거나 같은 데이터 검색 | 선택 | `36728652350` |
| `endMrktTotAmt` | 시가총액이 검색값보다 작은 데이터 검색 | 선택 | `36728652350` |

---

## 4.3 응답 필드

| 필드 | 설명 | 예시 |
|---|---|---|
| `resultCode` | API 호출 결과 코드 | `00` |
| `resultMsg` | API 호출 결과 메시지 | `NORMAL SERVICE.` |
| `numOfRows` | 한 페이지 결과 수 | `1` |
| `pageNo` | 페이지 번호 | `1` |
| `totalCount` | 전체 결과 수 | `1713576` |
| `basDt` | 기준일자 | `20220919` |
| `srtnCd` | 단축코드. 일반적으로 6자리 종목코드 | `900110` |
| `isinCd` | ISIN 코드 | `HK0000057197` |
| `itmsNm` | 종목명 | `이스트아시아홀딩스` |
| `mrktCtg` | 시장구분 | `KOSPI`, `KOSDAQ`, `KONEX` |
| `clpr` | 종가 | `167` |
| `vs` | 전일 대비 등락 | `-8` |
| `fltRt` | 등락률 | `-4.57` |
| `mkp` | 시가 | `173` |
| `hipr` | 고가 | `176` |
| `lopr` | 저가 | `167` |
| `trqu` | 거래량 | `2788311` |
| `trPrc` | 거래대금 | `475708047` |
| `lstgStCnt` | 상장주식수 | `219932050` |
| `mrktTotAmt` | 시가총액 | `36728652350` |

---

## 4.4 요청 예시

```text
https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=인증키&numOfRows=1&pageNo=1&resultType=json
```

---

## 4.5 머니북 적용 시 핵심 필드

| 목적 | 사용할 필드 |
|---|---|
| 기준일 표시 | `basDt` |
| 종목코드 저장 | `srtnCd` |
| 종목명 표시 | `itmsNm` |
| 시장구분 표시 | `mrktCtg` |
| 최근 종가 기준 평가 | `clpr` |
| 전일 대비 표시 | `vs` |
| 전일 등락률 표시 | `fltRt` |
| 거래량 참고 | `trqu` |
| 시가총액 참고 | `mrktTotAmt` |

---

# 5. 수익증권시세 API

## 5.1 기능 개요

| 항목 | 내용 |
|---|---|
| 기능명 | 수익증권시세 |
| 영문명 | `getSecuritiesPriceInfo` |
| 설명 | KRX에 상장된 수익증권의 시세 정보를 제공 |
| 호출 URL | `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getSecuritiesPriceInfo` |
| 평균 응답 시간 | 500ms |
| 초당 최대 트랜잭션 | 30 TPS |

---

## 5.2 주요 요청 파라미터

주식시세 API와 대부분 동일하다.

| 파라미터 | 설명 |
|---|---|
| `serviceKey` | 인증키 |
| `numOfRows` | 한 페이지 결과 수 |
| `pageNo` | 페이지 번호 |
| `resultType` | 응답 형식 |
| `basDt` | 기준일자 |
| `likeSrtnCd` | 단축코드 검색 |
| `isinCd` | ISIN 코드 |
| `itmsNm` | 종목명 |
| `likeItmsNm` | 종목명 포함 검색 |
| `beginVs`, `endVs` | 전일 대비 조건 검색 |
| `beginFltRt`, `endFltRt` | 등락률 조건 검색 |
| `beginTrqu`, `endTrqu` | 거래량 조건 검색 |
| `beginTrPrc`, `endTrPrc` | 거래대금 조건 검색 |
| `beginStLstgCnt`, `endStLstgCnt` | 상장좌수 조건 검색 |
| `beginMrktTotAmt`, `endMrktTotAmt` | 시가총액 조건 검색 |

---

## 5.3 응답 필드

| 필드 | 설명 |
|---|---|
| `basDt` | 기준일자 |
| `srtnCd` | 단축코드 |
| `isinCd` | ISIN 코드 |
| `itmsNm` | 종목명 |
| `clpr` | 종가 |
| `vs` | 전일 대비 |
| `fltRt` | 등락률 |
| `mkp` | 시가 |
| `hipr` | 고가 |
| `lopr` | 저가 |
| `trqu` | 거래량 |
| `trPrc` | 거래대금 |
| `stLstgCnt` | 상장좌수 |
| `mrktTotAmt` | 시가총액 |

---

# 6. 신주인수권증서시세 API

## 6.1 기능 개요

| 항목 | 내용 |
|---|---|
| 기능명 | 신주인수권증서시세 |
| 영문명 | `getPreemptiveRightCertificatePriceInfo` |
| 설명 | KRX에 상장된 신주인수권증서 시세 정보 |
| 호출 URL | `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getPreemptiveRightCertificatePriceInfo` |

---

## 6.2 주요 응답 필드

| 필드 | 설명 |
|---|---|
| `basDt` | 기준일자 |
| `srtnCd` | 단축코드 |
| `isinCd` | ISIN 코드 |
| `itmsNm` | 종목명 |
| `mrktCtg` | 시장구분 |
| `clpr` | 종가 |
| `vs` | 전일 대비 |
| `fltRt` | 등락률 |
| `mkp` | 시가 |
| `hipr` | 고가 |
| `lopr` | 저가 |
| `trqu` | 거래량 |
| `trPrc` | 거래대금 |
| `mrktTotAmt` | 시가총액 |
| `lstgCtfCnt` | 상장증서수 |
| `nstIssPrc` | 신주발행가 |
| `dltDt` | 상장폐지일 |
| `purRgtScrtItmsCd` | 목적주권 종목코드 |
| `purRgtScrtItmsNm` | 목적주권 종목명 |
| `purRgtScrtItmsClpr` | 목적주권 종가 |

---

# 7. 신주인수권증권시세 API

## 7.1 기능 개요

| 항목 | 내용 |
|---|---|
| 기능명 | 신주인수권증권시세 |
| 영문명 | `getPreemptiveRightSecuritiesPriceInfo` |
| 설명 | KRX에 상장된 신주인수권증권 시세 정보 |
| 호출 URL | `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getPreemptiveRightSecuritiesPriceInfo` |

---

## 7.2 주요 응답 필드

| 필드 | 설명 |
|---|---|
| `basDt` | 기준일자 |
| `srtnCd` | 단축코드 |
| `isinCd` | ISIN 코드 |
| `itmsNm` | 종목명 |
| `mrktCtg` | 시장구분 |
| `clpr` | 종가 |
| `vs` | 전일 대비 |
| `fltRt` | 등락률 |
| `mkp` | 시가 |
| `hipr` | 고가 |
| `lopr` | 저가 |
| `trqu` | 거래량 |
| `trPrc` | 거래대금 |
| `mrktTotAmt` | 시가총액 |
| `lstgScrtCnt` | 상장증권수 |
| `exertPric` | 행사가격 |
| `subtPdSttgDt` | 존속기간 시작일 |
| `subtPdEdDt` | 존속기간 종료일 |
| `purRgtScrtItmsCd` | 목적주권 종목코드 |
| `purRgtScrtItmsNm` | 목적주권 종목명 |
| `purRgtScrtItmsClpr` | 목적주권 종가 |

---

# 8. 공통 에러 코드

| 에러 코드 | 에러 메시지 | 설명 |
|---:|---|---|
| `1` | `APPLICATION_ERROR` | 어플리케이션 에러 |
| `10` | `INVALID_REQUEST_PARAMETER_ERROR` | 잘못된 요청 파라미터 에러 |
| `12` | `NO_OPENAPI_SERVICE_ERROR` | 해당 OpenAPI 서비스가 없거나 폐기됨 |
| `20` | `SERVICE_ACCESS_DENIED_ERROR` | 서비스 접근 거부 |
| `22` | `LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR` | 서비스 요청 제한 횟수 초과 |
| `30` | `SERVICE_KEY_IS_NOT_REGISTERED_ERROR` | 등록되지 않은 서비스키 |
| `31` | `DEADLINE_HAS_EXPIRED_ERROR` | 기한 만료된 서비스키 |
| `32` | `UNREGISTERED_IP_ERROR` | 등록되지 않은 IP |
| `99` | `UNKNOWN_ERROR` | 기타 에러 |

---

# 9. 머니북 투자 기능 적용 정리

## 9.1 사용 가능한 범위

| 항목 | 가능 여부 | 비고 |
|---|---:|---|
| 국내 주식 종목 검색 | 가능 | `itmsNm`, `likeItmsNm`, `srtnCd` 활용 |
| 국내 주식 종가 조회 | 가능 | `clpr` 사용 |
| 국내 주식 등락률 조회 | 가능 | `fltRt` 사용 |
| 국내 주식 전일 대비 조회 | 가능 | `vs` 사용 |
| 시가/고가/저가 조회 | 가능 | `mkp`, `hipr`, `lopr` |
| 거래량/거래대금 조회 | 가능 | `trqu`, `trPrc` |
| 시가총액 조회 | 가능 | `mrktTotAmt` |
| 해외주식 조회 | 불가 | 제공 범위 아님 |
| 실시간 현재가 조회 | 불가 | 일 1회 갱신 데이터 |
| 장중 시세 조회 | 불가 | 실시간 API가 아님 |

---

## 9.2 화면 문구 추천

실시간 현재가가 아니므로 `현재가`라는 표현은 피하는 것이 좋다.

### 추천 문구

```text
최근 종가 기준 평가금액
```

```text
최근 거래일 종가 기준으로 계산됩니다.
```

```text
이 투자 내역은 실시간 시세가 아닌 최근 거래일 종가 기준으로 계산됩니다.
```

```text
기준일: YYYY.MM.DD
```

---

## 9.3 계산 예시

사용자가 직접 입력한 보유 정보:

| 항목 | 값 |
|---|---:|
| 매수단가 | 70,000 |
| 수량 | 10 |
| 매수금액 | 700,000 |

API에서 받은 값:

| 항목 | 값 |
|---|---:|
| 최근 종가 `clpr` | 75,000 |

계산값:

```ts
const purchaseAmount = buyPrice * quantity;
const valuationAmount = closePrice * quantity;
const profitAmount = valuationAmount - purchaseAmount;
const profitRate = (profitAmount / purchaseAmount) * 100;
```

화면 표시:

| 항목 | 값 |
|---|---:|
| 매수금액 | 700,000원 |
| 최근 종가 기준 평가금액 | 750,000원 |
| 평가손익 | +50,000원 |
| 수익률 | +7.14% |

---

# 10. 개발 시 주의사항

## 10.1 기준일 처리

API는 기준일자 `basDt` 기준으로 데이터를 조회한다.

주말, 공휴일, 장 마감 전에는 원하는 날짜의 데이터가 없을 수 있다.  
따라서 최신 데이터를 가져올 때는 단순히 오늘 날짜만 조회하지 말고, 최근 며칠 범위를 조회한 뒤 가장 최신 `basDt`를 선택하는 방식이 안전하다.

예시:

```text
beginBasDt=20260601
endBasDt=20260605
```

그 후 응답 중 가장 큰 `basDt`를 최신 기준일로 사용한다.

---

## 10.2 종목 검색

종목명 완전 일치 검색은 `itmsNm`, 포함 검색은 `likeItmsNm`을 사용한다.

```text
likeItmsNm=삼성
```

종목코드 검색은 `likeSrtnCd`를 사용할 수 있다.

```text
likeSrtnCd=005930
```

---

## 10.3 머니북 MVP 기준 추천 사용 방식

머니북에서는 우선 `getStockPriceInfo`만 적용하는 것을 추천한다.

초기 MVP에서는 다음 범위로 제한하는 것이 좋다.

- 국내 주식
- KOSPI
- KOSDAQ
- KONEX
- 최근 종가 기준 평가
- 수익률 계산
- 기준일 표시

ETF, 수익증권, 신주인수권증권/증서는 이후 확장 기능으로 분리하는 것이 좋다.

---

# 11. 결론

이 API는 머니북 투자 기능에서 **국내 주식의 최근 종가 기준 평가금액과 수익률 계산**에 사용할 수 있다.

다만 다음 기능에는 적합하지 않다.

- 해외주식 조회
- 실시간 현재가 조회
- 장중 가격 조회
- 실시간 포트폴리오 평가

따라서 화면과 DB에서는 `현재가`보다는 `최근 종가`, `기준일 종가`, `최근 거래일 종가`라는 표현을 사용하는 것이 적절하다.
