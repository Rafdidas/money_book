import "../intro/intro.scss";

import Image from "next/image";

import visual from "@/assets/img/visual_img.png";
import free from "@/assets/img/free.png";
import phone from "@/assets/img/phone3.png";
import PublicCta from "@/components/common/PublicCta";
import IntroFooterLottie from "./IntroFooterLottie";

const concernItems = [
  {
    icon: "M146.67-160q-27 0-46.84-19.83Q80-199.67 80-226.67v-506.66q0-27 19.83-46.84Q119.67-800 146.67-800h666.66q27 0 46.84 19.83Q880-760.33 880-733.33v506.66q0 27-19.83 46.84Q840.33-160 813.33-160H146.67Zm0-66.67h666.66v-420H146.67v420Zm104-78.66h230v-66.67h-230v66.67Zm0-120h460v-66.67h-460v66.67Z",
    title: "어디에 돈을 썼는지 기억이 안 날 때",
    description: "월별 지출과 카테고리별 소비를 한눈에 확인할 수 있어요.",
  },
  {
    icon: "M186.67-80q-27 0-46.84-19.83Q120-119.67 120-146.67v-600q0-27 19.83-46.83 19.84-19.83 46.84-19.83h56.66V-880h70v66.67h333.34V-880h70v66.67h56.66q27 0 46.84 19.83Q840-773.67 840-746.67v600q0 27-19.83 46.84Q800.33-80 773.33-80H186.67Zm0-66.67h586.66v-420H186.67v420Zm96-138.66h132v-132h-132v132Z",
    title: "고정지출이 매달 헷갈릴 때",
    description: "구독료, 보험료처럼 반복되는 지출을 따로 관리할 수 있어요.",
  },
  {
    icon: "M480-332q-27.67 0-46.83-19.5Q414-371 414-398.67q0-27.66 19.17-47.16 19.16-19.5 46.83-19.5 28.33 0 47.83 19.5t19.5 47.16q0 27.67-19.5 47.17T480-332ZM304.33-676.67H657L738.33-840h-516l82 163.33Zm29 556.67h294q88.67 0 151-62.17 62.34-62.16 62.34-151.16-.67-38-13.34-73-12.66-35-36.66-64L674.67-610H286L169.33-470.33q-23.33 29-36.33 64t-13 73q0 89 62.17 151.16Q244.33-120 333.33-120Z",
    title: "저축 목표를 계속 놓칠 때",
    description: "목표 금액과 달성률을 보면서 저축 흐름을 확인할 수 있어요.",
  },
  {
    icon: "M120-160v-230h108v230H120Zm204.67-245.33v-190H432v190H324.67Zm204-205.34V-800H636v189.33H528.67Zm204 450.67v-640H840v640H732.67Z",
    title: "투자금까지 함께 보고 싶을 때",
    description: "주식 기록을 가계부 흐름 안에서 함께 정리할 수 있어요.",
  },
];

const valueItems = [
  {
    metric: "01",
    title: "월별 흐름 파악",
    description: "이번 달 수입, 지출, 저축, 투자 흐름을 한 화면에서 확인합니다.",
  },
  {
    metric: "02",
    title: "반복 예정 관리",
    description: "고정지출과 적금을 따로 등록해 남은 예정 금액까지 볼 수 있습니다.",
  },
  {
    metric: "03",
    title: "자산 흐름 정리",
    description: "소비뿐 아니라 저축과 투자원금까지 함께 기록해 더 넓게 봅니다.",
  },
];

const featureItems = [
  {
    eyebrow: "기록",
    title: "수입과 지출을 빠르게 남겨요",
    description:
      "월급, 부수입, 식비, 교통비처럼 매달 발생하는 돈을 기록하고 남은 돈을 바로 확인합니다.",
    points: ["월별 내역", "카테고리 구분", "남은 돈 계산"],
  },
  {
    eyebrow: "예정",
    title: "고정지출과 저축을 따로 챙겨요",
    description:
      "매달 반복되는 지출과 적금을 등록해 실제 지출과 앞으로 나갈 돈을 구분합니다.",
    points: ["고정지출 등록", "저축 목표", "예정 반영 잔액"],
  },
  {
    eyebrow: "분석",
    title: "차트와 투자 기록까지 함께 봐요",
    description:
      "월별 분석에서 소비 패턴을 확인하고, 보유 주식과 투자원금도 한 흐름으로 정리합니다.",
    points: ["월별 분석", "투자 기록", "포트폴리오 비중"],
  },
];

const showcaseSummaries = [
  {
    label: "이번 달 남은 돈",
    value: "820,000원",
    tone: "primary",
  },
  {
    label: "예정 반영 후",
    value: "540,000원",
    tone: "green",
  },
  {
    label: "투자 원금",
    value: "3,200,000원",
    tone: "neutral",
  },
];

const Icon = ({ path }: { path: string }) => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
    <path d={path} />
  </svg>
);

export default function IntroPage() {
  return (
    <div className="intro-page">
      <section className="intro-visual" aria-labelledby="intro-hero-title">
        <div className="intro-visual--inner">
          <div className="intro-visual--text">
            <p className="visual-text--subtitle">쉽고 직관적인 나만의 가계부</p>
            <h1 id="intro-hero-title" className="visual-text--title">
              수입, 지출, 저축, 투자까지
              <br />
              한눈에 정리하는 나만의 가계부
            </h1>
            <p className="visual-text--summary">
              매달 들어오는 돈과 나가는 돈을 기록하고,
              <br />
              고정지출, 저축 목표, 투자 내역까지 한 화면에서 관리해보세요.
            </p>
            <div className="visual-text--btnGroup">
              <PublicCta variant="hero" />
              <a className="button button--lg button--outline-primary" href="#intro-features">
                주요 기능 보기
              </a>
            </div>
          </div>
          <div className="intro-visual--img">
            <Image
              src={visual}
              width={1672}
              height={941}
              sizes="(max-width: 900px) calc(100vw - 40px), 55vw"
              loading="eager"
              alt="머니북가계부 대시보드 화면"
            />
          </div>
        </div>
      </section>

      <section className="intro-card" aria-labelledby="intro-concerns-title">
        <div className="intro-section-heading">
          <span className="intro-section-heading--eyebrow">WHY MONEY BOOK</span>
          <h2 id="intro-concerns-title">돈 관리는 하고 싶은데, 매번 복잡하게 느껴졌다면</h2>
        </div>
        <ul className="card-list">
          {concernItems.map((item) => (
            <li className="card-list--items" key={item.title}>
              <div className="card-item--img">
                <Icon path={item.icon} />
              </div>
              <div className="card-item--text">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="intro-value" aria-labelledby="intro-value-title">
        <div className="intro-section-heading">
          <span className="intro-section-heading--eyebrow">WHAT IT SOLVES</span>
          <h2 id="intro-value-title">머니북은 단순한 지출 기록장이 아니에요</h2>
          <p>
            흩어진 돈의 흐름을 한곳에 모아 현재 상태와 앞으로의 예정 흐름을 함께
            보여줍니다.
          </p>
        </div>
        <div className="intro-value--grid">
          {valueItems.map((item) => (
            <article className="intro-value-card" key={item.title}>
              <span>{item.metric}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="intro-func" id="intro-features" aria-labelledby="intro-features-title">
        <div className="intro-section-heading intro-section-heading--center">
          <span className="intro-section-heading--eyebrow">FEATURES</span>
          <h2 id="intro-features-title">돈의 흐름을 관리하는 데 필요한 기능만 담았어요</h2>
          <p>
            복잡한 금융 서비스가 아니라, 일상에서 자주 확인해야 하는 수입, 지출,
            저축, 투자 흐름에 집중했습니다.
          </p>
        </div>
        <div className="function-showcase">
          <div className="function-showcase--preview">
            <Image
              src={visual}
              width={1672}
              height={941}
              sizes="(max-width: 900px) calc(100vw - 48px), 46vw"
              loading="eager"
              alt="머니북 주요 기능 화면 예시"
            />
            <div className="function-showcase--summary" aria-label="머니북 월간 요약 예시">
              {showcaseSummaries.map((item) => (
                <div className={`showcase-summary-card showcase-summary-card--${item.tone}`} key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="function-list">
            {featureItems.map((item) => (
              <article className="function-list--items" key={item.title}>
                <span>{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <ul>
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="intro-bottom" aria-labelledby="intro-access-title">
        <div className="intro-section-heading intro-section-heading--center">
          <span className="intro-section-heading--eyebrow">START EASY</span>
          <h2 id="intro-access-title">부담 없이 시작하고, 어디서나 기록하세요</h2>
        </div>
        <div className="intro-bottom--inner">
          <article className="bottom-content">
            <div className="bottom-content--text">
              <h3>기본 기능은 무료로 사용할 수 있어요</h3>
              <p>
                수입, 지출, 고정지출, 저축, 투자 기록까지 추가 비용 없이 관리해보세요.
              </p>
              <div className="bottom-content--badges" aria-label="무료 사용 특징">
                <span>무료 사용</span>
                <span>회원가입 후 바로 시작</span>
                <span>주요 기능 제공</span>
              </div>
            </div>
            <div className="bottom-content--img">
              <Image
                src={free}
                width={859}
                height={588}
                sizes="(max-width: 640px) calc(100vw - 80px), 220px"
                alt="무료 이용 가능"
              />
            </div>
          </article>
          <article className="bottom-content">
            <div className="bottom-content--text">
              <h3>PC와 모바일에서 함께 사용할 수 있어요</h3>
              <p>
                집에서는 PC로 정리하고, 밖에서는 모바일로 빠르게 기록하세요. 별도 앱 설치
                없이 브라우저에서 바로 사용할 수 있습니다.
              </p>
              <div className="bottom-content--badges" aria-label="모바일 사용 특징">
                <span>모바일 최적화</span>
                <span>PC/모바일 동기화</span>
                <span>홈 화면 추가 가능</span>
              </div>
            </div>
            <div className="bottom-content--img">
              <Image
                src={phone}
                width={1536}
                height={1024}
                sizes="(max-width: 640px) calc(100vw - 80px), 300px"
                alt="플랫폼 상관없이 이용"
              />
            </div>
          </article>
        </div>
      </section>

      <section className="intro-banner" aria-labelledby="intro-final-cta-title">
        <div className="intro-banner--inner">
          <div>
            <h2 id="intro-final-cta-title">오늘부터 돈의 흐름을 정리해보세요</h2>
            <p>수입, 지출, 저축, 투자까지 흩어진 기록을 머니북에서 한 번에 관리하세요.</p>
          </div>
          <IntroFooterLottie />
          <PublicCta variant="banner" />
        </div>
      </section>
    </div>
  );
}
