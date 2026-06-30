import "../intro/intro.scss";

import Image from "next/image";
import Link from "next/link";

import feature from "@/assets/img/renewal/feature.svg";
import gift from "@/assets/img/renewal/gift.svg";
import hero from "@/assets/img/renewal/hero.svg";
import iconInvest from "@/assets/img/renewal/icon-invest.svg";
import iconPiggy from "@/assets/img/renewal/icon-piggy.svg";
import iconRecurring from "@/assets/img/renewal/icon-recurring.svg";
import iconSearch from "@/assets/img/renewal/icon-search.svg";
import sync from "@/assets/img/renewal/sync.svg";
import IntroCta from "./IntroCta";

const concernItems = [
  {
    icon: iconSearch,
    title: "어디에 썼는지 기억이 안 날 때",
    description: "월별 지출과 카테고리별 소비를 한눈에 확인해요.",
  },
  {
    icon: iconRecurring,
    title: "고정지출이 매달 헷갈릴 때",
    description: "구독료·보험료처럼 반복되는 지출을 따로 관리해요.",
  },
  {
    icon: iconPiggy,
    title: "저축 목표를 자꾸 놓칠 때",
    description: "목표 금액과 달성률을 보면서 저축 흐름을 확인해요.",
  },
  {
    icon: iconInvest,
    title: "투자까지 함께 보고 싶을 때",
    description: "주식 기록을 가계부 흐름 안에서 함께 정리해요.",
  },
];

const valueItems = [
  {
    metric: "01",
    title: "월별 흐름 파악",
    description: "이번 달 수입·지출·저축·투자 흐름을 한 화면에서 확인해요.",
  },
  {
    metric: "02",
    title: "반복 예정 관리",
    description: "고정지출과 적금을 등록해 남은 예정 금액까지 볼 수 있어요.",
  },
  {
    metric: "03",
    title: "자산 흐름 정리",
    description: "소비뿐 아니라 저축과 투자원금까지 함께 기록해 더 넓게 봐요.",
  },
];

const featureItems = [
  {
    tone: "green",
    eyebrow: "기록",
    title: "수입과 지출을 빠르게 남겨요",
    description: "월급·부수입·식비처럼 매일 발생하는 돈을 기록하고 남은 돈을 바로 확인해요.",
  },
  {
    tone: "blue",
    eyebrow: "예정",
    title: "고정지출과 저축을 따로 챙겨요",
    description: "매달 반복되는 지출과 적금을 등록해 실제 지출과 앞으로 나갈 돈을 구분해요.",
  },
  {
    tone: "purple",
    eyebrow: "분석",
    title: "차트와 투자 기록까지 함께 봐요",
    description: "월별 분석으로 소비 패턴을 확인하고, 보유 주식과 투자원금도 한 흐름으로 정리해요.",
  },
];

const trustItems = ["완전 무료", "설치 없이 바로", "PC·모바일 동기화"];

const CheckIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <polyline
      points="20 6 9 17 4 12"
      stroke="#03b26c"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function IntroPage() {
  return (
    <div className="intro-page">
      <header className="intro-header">
        <Link href="/" className="intro-brand" aria-label="머니북가계부 홈">
          <span className="intro-brand__mark">M</span>
          <span className="intro-brand__name">머니북가계부</span>
        </Link>
        <IntroCta placement="header" />
      </header>

      <section className="intro-hero" aria-labelledby="intro-hero-title">
        <div className="intro-hero__content">
          <div className="intro-hero__text">
            <div className="intro-hero__badge">
              <span aria-hidden="true" />쉽고 직관적인 나만의 가계부
            </div>
            <h1 id="intro-hero-title">
              수입, 지출, 저축,
              <br />
              투자까지
              <br />
              한눈에 정리해요
            </h1>
            <p>
              매달 들어오고 나가는 돈을 기록하고,
              <br />
              고정지출·저축·투자까지 한 화면에서 관리해요.
            </p>
            <IntroCta placement="hero" />
            <div className="intro-hero__trust" aria-label="서비스 특징">
              {trustItems.map((item) => (
                <span key={item}>
                  <CheckIcon />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="intro-hero__visual">
            <div className="intro-hero__glow" aria-hidden="true" />
            <Image src={hero} width={460} height={420} priority alt="머니북가계부 일러스트" />
          </div>
        </div>
      </section>

      <section className="intro-concerns" aria-labelledby="intro-concerns-title">
        <div className="intro-section-heading">
          <span>WHY MONEY BOOK</span>
          <h2 id="intro-concerns-title">
            돈 관리, 매번 복잡하게
            <br />
            느껴졌다면
          </h2>
        </div>
        <div className="intro-concern-grid">
          {concernItems.map((item) => (
            <article className="intro-concern-card" key={item.title}>
              <Image src={item.icon} width={56} height={56} alt="" />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="intro-values" aria-labelledby="intro-values-title">
        <div className="intro-values__inner">
          <div className="intro-section-heading">
            <span>WHAT IT SOLVES</span>
            <h2 id="intro-values-title">단순한 지출 기록장이 아니에요</h2>
            <p>흩어진 돈의 흐름을 한곳에 모아 현재 상태와 앞으로의 예정까지 함께 보여줘요.</p>
          </div>
          <div className="intro-value-grid">
            {valueItems.map((item) => (
              <article className="intro-value-card" key={item.title}>
                <strong>{item.metric}</strong>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="intro-features" aria-labelledby="intro-features-title">
        <div className="intro-features__heading">
          <span>FEATURES</span>
          <h2 id="intro-features-title">필요한 기능만 담았어요</h2>
        </div>
        <div className="intro-feature-showcase">
          <Image src={feature} width={520} height={380} alt="머니북가계부 대시보드 미리보기" />
          <div className="intro-feature-list">
            {featureItems.map((item) => (
              <article className="intro-feature-item" key={item.title}>
                <span className={`intro-feature-item__eyebrow intro-feature-item__eyebrow--${item.tone}`}>{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="intro-access" aria-label="서비스 이용 특징">
        <div className="intro-access-grid">
          <article className="intro-access-card intro-access-card--blue">
            <div>
              <h2>기본 기능은 무료예요</h2>
              <p>수입·지출·저축·투자까지 추가 비용 없이 관리해요.</p>
            </div>
            <Image src={gift} width={92} height={92} alt="" />
          </article>
          <article className="intro-access-card intro-access-card--purple">
            <div>
              <h2>PC와 모바일 어디서나</h2>
              <p>집에선 PC로, 밖에선 모바일로. 설치 없이 브라우저에서 바로요.</p>
            </div>
            <Image src={sync} width={92} height={92} alt="" />
          </article>
        </div>
      </section>

      <section className="intro-final" aria-labelledby="intro-final-title">
        <div className="intro-final__inner">
          <h2 id="intro-final-title">
            오늘부터 돈의 흐름을
            <br />
            정리해보세요
          </h2>
          <p>수입·지출·저축·투자까지 흩어진 기록을 머니북에서 한 번에 관리해요.</p>
          <IntroCta placement="banner" />
        </div>
      </section>

      <footer className="intro-footer">
        <Link href="/" className="intro-footer__brand" aria-label="머니북가계부 홈">
          <span className="intro-footer__mark">M</span>
          <span>머니북가계부</span>
        </Link>
        <p>개인 가계부 서비스</p>
      </footer>
    </div>
  );
}
