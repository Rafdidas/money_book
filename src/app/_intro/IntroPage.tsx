"use client";
import "../intro/intro.scss";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import visual from "@/assets/img/visual_img.png";
import free from "@/assets/img/free.png";
import phone from "@/assets/img/phone3.png";
import { usePublicAppSession } from "@/hooks/usePublicAppSession";
import { enableDemoMode } from "@/lib/demo";



export default function IntroPage() {
  const router = useRouter();
  const { hasAppSession, isSessionResolved } = usePublicAppSession();

  const handleDemoLogin = () => {
    enableDemoMode();
    router.replace("/app");
    router.refresh();
  };

  return (
    <main className="intro-page">
      <section className="intro-visual">
        <div className="intro-visual--inner">
          <div className="intro-visual--text">
            <h1 className="visual-text--subtitle">쉽고 직관적인 나만의 가계부</h1>
            <h2 className="visual-text--title">
              머니북 가계부로
              <br />
              똑똑하게 관리하세요
            </h2>
            <span className="visual-text--summary">
              수입과 지출을 체계적으로 관리하고,
              <br />
              분석을 통해 더 나은 소비 습관을 만들어 보세요.
            </span>
            <div className="visual-text--btnGroup">
              {isSessionResolved && hasAppSession ? (
                <Link href="/app" className="button button--lg button--primary">
                  가계부로 이동
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="button button--lg button--primary ">
                    무료로 시작하기
                  </Link>
                  <button
                    type="button"
                    className="button button--lg button--outline-primary"
                    onClick={handleDemoLogin}
                  >
                    데모 버전 체험하기
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="intro-visual--img">
            <Image src={visual} width={1672} height={941} alt="머니북가계부" priority />
          </div>
        </div>
      </section>
      <section className="intro-card">
        <h3 className="intro-card--title">이런 분들에게 좋아요</h3>
        <ul className="card-list">
          <li className="card-list--items">
            <div className="card-item--img">
              <span className="material-symbols-outlined" aria-hidden="true">
                credit_card_gear
              </span>
            </div>
            <div className="card-item--text">
              <h4>지출 관리가 어려운 분</h4>
              <p>
                어디에 돈을 쓰고 있는지
                <br />
                파악하고 싶은 분들
              </p>
            </div>
          </li>
          <li className="card-list--items">
            <div className="card-item--img">
              <span className="material-symbols-outlined" aria-hidden="true">
                savings
              </span>
            </div>
            <div className="card-item--text">
              <h4>저축 목표를 이루고 싶은 분</h4>
              <p>
                체계적인 저축 관리로
                <br />
                목표 달성을 원하는 분들
              </p>
            </div>
          </li>
          <li className="card-list--items">
            <div className="card-item--img">
              <span className="material-symbols-outlined" aria-hidden="true">
                calendar_month
              </span>
            </div>
            <div className="card-item--text">
              <h4>고정지출을 관리하고 싶은 분</h4>
              <p>
                매달 나가는 고정비를
                <br />
                한눈에 관리하고 싶은 분들
              </p>
            </div>
          </li>
        </ul>
      </section>
      <section className="intro-func">
        <h3 className="intro-func--title">주요기능</h3>
        <ul className="function-list">
          <li className="function-list--items">
            <div className="function-item--img">
              <span className="material-symbols-outlined" aria-hidden="true">
                wallet
              </span>
            </div>
            <div className="function-item--text">
              <h4>월별 수입/지출 관리</h4>
              <p>
                월별 수입과 지출을 쉽고 빠르게
                <br />
                기록하고 관리할 수 있어요.
              </p>
            </div>
          </li>
          <li className="function-list--items">
            <div className="function-item--img">
              <span className="material-symbols-outlined" aria-hidden="true">
                receipt_long
              </span>
            </div>
            <div className="function-item--text">
              <h4>고정지출 관리</h4>
              <p>
                매달 발생하는 고정지출을 등록하고
                <br />
                자동으로 관리할 수 있어요.
              </p>
            </div>
          </li>
          <li className="function-list--items">
            <div className="function-item--img">
              <span className="material-symbols-outlined" aria-hidden="true">
                money_bag
              </span>
            </div>
            <div className="function-item--text">
              <h4>저축 관리</h4>
              <p>
                적금 및 저축을 등록하여
                <br />
                달성 현황 및 리스트를 확인할 수 있어요.
              </p>
            </div>
          </li>
          <li className="function-list--items">
            <div className="function-item--img">
              <span className="material-symbols-outlined" aria-hidden="true">
                pie_chart
              </span>
            </div>
            <div className="function-item--text">
              <h4>카테고리별 분석 차트</h4>
              <p>
                카테고리별 지출을 분석하여
                <br />
                소비 패턴을 한눈에 확인할 수 있어요.
              </p>
            </div>
          </li>
        </ul>
      </section>
      <section className="intro-bottom">
        <div className="intro-bottom--inner">
          <div className="bottom-content">
            <div className="bottom-content--text">
              <h3>무료로 사용할 수 있나요?</h3>
              <p>
                네! 머니북 가계부는 기본 기능을 모두 무료로 제공해요.
                <br />
                회원가입만 하면 바로 시작할 수 있고,
                <br />
                추가 비용 없이 모든 기능을 이용할 수 있습니다.
              </p>
            </div>
            <div className="bottom-content--img">
              <Image src={free} width={859} height={588} alt="무료이용 가능" priority />
            </div>
          </div>
          <div className="bottom-content">
            <div className="bottom-content--text">
              <h3>모바일에서도 사용할 수 있나요?</h3>
              <p>
                네! 모바일 웹을 통해 언제 어디서나 편리하게 사용할 수 있어요.
                <br />
                PC와 모바일에서 실시간으로 동기화되어
                <br />
                데이터가 안전하게 관리됩니다.
              </p>
            </div>
            <div className="bottom-content--img">
              <Image
                src={phone}
                width={1536}
                height={1024}
                alt="플랫폼 상관없이 이용"
                priority
              />
            </div>
          </div>
        </div>
      </section>
      <section className="intro-banner">
        <div className="intro-banner--inner">
          <p>지금 바로 머니북 가계부를 시작해 보세요!</p>
          {isSessionResolved && hasAppSession ? (
            <Link href="/app" className="button button--md button--outline-primary">
              가계부로 이동
            </Link>
          ) : (
            <Link href="/auth/login" className="button button--md button--outline-primary">
              무료로 시작하기
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
