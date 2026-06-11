import "../intro/intro.scss";

import Image from "next/image";

import visual from "@/assets/img/visual_img.png";
import free from "@/assets/img/free.png";
import phone from "@/assets/img/phone3.png";
import PublicCta from "@/components/common/PublicCta";

export default function IntroPage() {
  return (
    <div className="intro-page">
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
              <PublicCta variant="hero" />
            </div>
          </div>
          <div className="intro-visual--img">
            <Image
              src={visual}
              width={1672}
              height={941}
              sizes="(max-width: 900px) calc(100vw - 40px), 55vw"
              loading="eager"
              fetchPriority="high"
              alt="머니북가계부 대시보드 화면"
            />
          </div>
        </div>
      </section>
      <section className="intro-card">
        <h3 className="intro-card--title">이런 분들에게 좋아요</h3>
        <ul className="card-list">
          <li className="card-list--items">
            <div className="card-item--img">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                width="40px"
                fill="#3e75d4"
              >
                <path d="m682-68.67-7.33-52q-18-5.66-34.17-14.83T610-157.33L562.67-138 526-196.67 566.67-230Q562-247.67 562-266.33q0-18.67 4.67-36.34L526-336l36.67-59.33L610-376q15-12 30.83-21.17 15.84-9.16 33.84-14.83l7.33-52.67h66.67l8 52.67q18 5.67 33.83 14.83Q806.33-388 821.33-376l47.34-19.33L905.33-336l-40.66 33.33q4.66 17.67 4.66 36.34 0 18.66-4.66 36.33l40.66 33.33L868.67-138l-47.34-19.33q-14.33 12.66-30.5 21.83-16.16 9.17-34.16 14.83l-8 52H682Zm100.17-131.16Q810-227.67 810-266.67t-27.83-66.83q-27.84-27.83-66.84-27.83T648.5-333.5q-27.83 27.83-27.83 66.83t27.83 66.84Q676.33-172 715.33-172t66.84-27.83ZM146.67-160q-27 0-46.84-19.83Q80-199.67 80-226.67v-506.66q0-27 19.83-46.84Q119.67-800 146.67-800h666.66q27 0 46.84 19.83Q880-760.33 880-733.33v239.66q-15.33-11-32-19.66Q831.33-522 813.33-529v-105H146.67v139.33h410q-55 37.34-87.84 96.84Q436-338.33 436-266.67q0 28 5.33 55.17 5.34 27.17 15.67 51.5H146.67Z" />
              </svg>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                width="40px"
                fill="#3e75d4"
              >
                <path d="M668.5-531.5Q680-543 680-560t-11.5-28.5Q657-600 640-600t-28.5 11.5Q600-577 600-560t11.5 28.5Q623-520 640-520t28.5-11.5ZM320-613.33h200V-680H320v66.67ZM180-120q-34-114-67-227.5T80-580q0-92 64-156t156-64h200q29-38 70.5-59t89.5-21q25 0 42.5 17.5T720-820q0 5-5 23-4 11-7.5 22.5T702-751l91 91h87v279l-113 37-67 224H480v-80h-80v80H180Z" />
              </svg>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                width="40px"
                fill="#3e75d4"
              >
                <path d="M318.67-418v-298.67h100V-418l-50-48.67-50 48.67Zm196 80.67V-880h100v442.67l-100 100Zm-392 112.66v-328h100v228l-100 100ZM120-118l250-250 146.67 128.67L766-488.67h-80v-66.66h194V-362h-66.67v-80l-294 294-146.66-128-158 158H120Z" />
              </svg>
            </div>
            <div className="card-item--text">
              <h4>투자를 시작한 분</h4>
              <p>
                투자 내역을 기록하고
                <br />
                성과를 관리하고 싶은 분들
              </p>
            </div>
          </li>
          <li className="card-list--items">
            <div className="card-item--img">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                width="40px"
                fill="#3e75d4"
              >
                <path d="M480-400q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-188.5-11.5Q280-423 280-440t11.5-28.5Q303-480 320-480t28.5 11.5Q360-457 360-440t-11.5 28.5Q337-400 320-400t-28.5-11.5ZM640-400q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-188.5-11.5Q280-263 280-280t11.5-28.5Q303-320 320-320t28.5 11.5Q360-297 360-280t-11.5 28.5Q337-240 320-240t-28.5-11.5ZM640-240q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240ZM186.67-80q-27 0-46.84-19.83Q120-119.67 120-146.67v-600q0-27 19.83-46.83 19.84-19.83 46.84-19.83h56.66V-880h70v66.67h333.34V-880h70v66.67h56.66q27 0 46.84 19.83Q840-773.67 840-746.67v600q0 27-19.83 46.84Q800.33-80 773.33-80H186.67Zm0-66.67h586.66v-420H186.67v420Z" />
              </svg>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                width="40px"
                fill="#3e75d4"
              >
                <path d="M240-160q-66 0-113-47T80-320v-320q0-66 47-113t113-47h480q66 0 113 47t47 113v320q0 66-47 113t-113 47H240Zm0-473.33h480q26.67 0 50.33 7.66Q794-618 813.33-603v-37q0-39-27.16-66.17Q759-733.33 720-733.33H240q-39 0-66.17 27.16Q146.67-679 146.67-640v37q19.33-15 43-22.67 23.66-7.66 50.33-7.66Zm-89.33 134L617-386.67q7.67 2 15.67.34 8-1.67 14-7l153-128q-12.34-20.34-33.34-32.84-21-12.5-46.33-12.5H240q-32 0-56.5 18.84-24.5 18.83-32.83 48.5Z" />
              </svg>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                width="40px"
                fill="#3e75d4"
              >
                <path d="M228-80q-45.83 0-77.92-32.08Q118-144.17 118-190v-123.33h124.67V-880l59.86 60 59.87-60 59.87 60 59.86-60L542-820l60-60 60 60 60-60 60 60 60-60v690q0 45.83-32.08 77.92Q777.83-80 732-80H228Zm503-66.67q18.67 0 30.5-12.16Q773.33-171 773.33-190v-594h-462v504h380v90q0 19 10.5 31.17 10.5 12.16 29.17 12.16ZM360-628v-66.67h240V-628H360Zm0 129.33v-66.66h240v66.66H360ZM688.67-628q-13.67 0-23.5-9.83-9.84-9.84-9.84-23.5 0-13.67 9.84-23.5 9.83-9.84 23.5-9.84 13.66 0 23.5 9.84Q722-675 722-661.33q0 13.66-9.83 23.5-9.84 9.83-23.5 9.83Zm0 126q-13.67 0-23.5-9.83-9.84-9.84-9.84-23.5 0-13.67 9.84-23.5 9.83-9.84 23.5-9.84 13.66 0 23.5 9.84Q722-549 722-535.33q0 13.66-9.83 23.5-9.84 9.83-23.5 9.83Z" />
              </svg>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                width="40px"
                fill="#3e75d4"
              >
                <path d="M480-332q-27.67 0-46.83-19.5Q414-371 414-398.67q0-27.66 19.17-47.16 19.16-19.5 46.83-19.5 28.33 0 47.83 19.5t19.5 47.16q0 27.67-19.5 47.17T480-332ZM304.33-676.67H657L738.33-840h-516l82 163.33Zm29 556.67h294q88.67 0 151-62.17 62.34-62.16 62.34-151.16-.67-38-13.34-73-12.66-35-36.66-64L674.67-610H286L169.33-470.33q-23.33 29-36.33 64t-13 73q0 89 62.17 151.16Q244.33-120 333.33-120Z" />
              </svg>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                width="40px"
                fill="#3e75d4"
              >
                <path d="M120-160v-230h108v230H120Zm204.67-245.33v-190H432v190H324.67Zm204-205.34V-800H636v189.33H528.67Zm204 450.67v-640H840v640H732.67Z" />
              </svg>
            </div>
            <div className="function-item--text">
              <h4>투자기록</h4>
              <p>
                투자 내역과 수익률을 기록하고
                <br />
                포트폴리오를 관리할 수 있어요.
              </p>
            </div>
          </li>
          <li className="function-list--items">
            <div className="function-item--img">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                width="40px"
                fill="#3e75d4"
              >
                <path d="M513.33-513.33V-838Q643-827.67 734.17-735 825.33-642.33 838-513.33H513.33Zm-66.33 391q-138-12.34-231.83-115.34-93.84-103-93.84-242.33 0-139.67 93.84-242.67Q309-825.67 447-838v715.67Zm66.33 0V-447H838q-12 129-103.5 221.83-91.5 92.84-221.17 102.84Z" />
              </svg>
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
              <Image
                src={free}
                width={859}
                height={588}
                sizes="(max-width: 640px) calc(100vw - 80px), 220px"
                alt="무료 이용 가능"
              />
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
                sizes="(max-width: 640px) calc(100vw - 80px), 300px"
                alt="플랫폼 상관없이 이용"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="intro-banner">
        <div className="intro-banner--inner">
          <p>지금 바로 머니북 가계부를 시작해 보세요!</p>
          <PublicCta variant="banner" />
        </div>
      </section>
    </div>
  );
}
