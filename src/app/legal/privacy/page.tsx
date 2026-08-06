import type { Metadata } from "next";
import Link from "next/link";
import {
  CSP_REPORT_RETENTION_DAYS,
  CURRENT_PRIVACY_VERSION,
  LEGAL_CONTACT_EMAIL,
  LEGAL_MINIMUM_AGE,
  LEGAL_OPERATOR_NAME,
  LEGAL_PRIVACY_OFFICER_NAME,
  LEGAL_SERVICE_NAME,
} from "@/lib/legal/legalDocuments";

export const metadata: Metadata = {
  // 루트 레이아웃의 `title.template`이 " | 머니북가계부"를 붙이므로 여기서는 붙이지 않는다.
  title: "개인정보 처리방침",
  description:
    "머니북가계부가 처리하는 개인정보의 항목, 목적, 보유 기간, 위탁과 국외 이전, 이용자의 권리를 안내합니다.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <article className="legal-doc">
        <header className="legal-doc__head">
          <h1>개인정보 처리방침</h1>
          <p className="legal-doc__meta">시행일: {CURRENT_PRIVACY_VERSION}</p>
        </header>

        <p>
          {LEGAL_SERVICE_NAME}(이하 &ldquo;서비스&rdquo;)는 개인이 운영하는 무료 가계부 서비스로,
          「개인정보 보호법」을 준수하며 이용자의 개인정보를 보호하기 위해 다음과 같이 처리방침을
          수립·공개합니다.
        </p>

        <section>
          <h2>1. 처리하는 개인정보의 항목</h2>
          <div className="legal-doc__table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">구분</th>
                  <th scope="col">항목</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>회원 가입·계정 관리</td>
                  <td>이름, 이메일 주소, 암호화된 비밀번호, 인증 세션 정보, 약관·개인정보 동의 기록</td>
                </tr>
                <tr>
                  <td>가계부 기능</td>
                  <td>수입·지출·저축·고정지출 내역, 카테고리, 금액, 일자, 메모</td>
                </tr>
                <tr>
                  <td>투자 기록</td>
                  <td>종목명, 종목코드, 수량, 매수가, 매수일, 계좌 유형, 연간 한도</td>
                </tr>
                <tr>
                  <td>문의 대응</td>
                  <td>이메일 주소, 문의 제목과 내용, 답변 내용</td>
                </tr>
                <tr>
                  <td>보안·운영(자동 생성)</td>
                  <td>인증 쿠키, 접속 IP, 브라우저 및 기기 정보, 접속·오류 기록, 보안 정책 위반 보고</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            서비스는 주민등록번호 등 고유식별정보와 「개인정보 보호법」 제23조의 민감정보를 수집하지
            않습니다.
          </p>
        </section>

        <section>
          <h2>2. 개인정보의 처리 목적</h2>
          <ul>
            <li>회원 가입과 계정 인증 및 관리</li>
            <li>가계부·투자 기록의 저장, 조회, 분석 결과 제공</li>
            <li>문의 접수와 답변</li>
            <li>부정 이용 방지, 오류 대응 등 서비스의 안정적 운영과 보안 확보</li>
            <li>법령상 의무의 이행</li>
          </ul>
          <p>
            서비스는 위 목적 범위를 넘어 개인정보를 이용하지 않으며, 목적이 변경되는 경우 사전에
            동의를 받습니다.
          </p>
        </section>

        <section>
          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <ul>
            <li>
              회원 정보와 가계부·투자·문의 기록: 회원 탈퇴 또는 삭제 요청 시까지 보관하며, 요청을
              받으면 지체 없이 파기합니다.
            </li>
            <li>
              보안 정책 위반 보고 기록: 수집일로부터 {CSP_REPORT_RETENTION_DAYS}일이 지나면 자동으로
              삭제됩니다.
            </li>
            <li>접속·오류 기록: 서비스 운영과 장애 대응에 필요한 기간 동안 보관한 뒤 삭제합니다.</li>
            <li>
              다른 법령에서 일정 기간의 보존을 정하고 있는 경우에는 해당 기간 동안만 보관한 뒤
              파기합니다.
            </li>
          </ul>
        </section>

        <section>
          <h2>4. 개인정보의 제3자 제공</h2>
          <p>
            서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 이용자가 사전에 동의한
            경우, 또는 법령에 따라 수사기관이 적법한 절차로 요구하는 경우에는 예외로 합니다.
          </p>
          <p>
            투자 화면의 종목 검색과 시세 조회는 서버가 한국투자증권 및 금융위원회의 공개 API에
            요청하는 방식으로 동작합니다. 이때{" "}
            <strong>이용자의 보유 수량, 매수가 등 개인 투자 기록은 외부로 전송되지 않습니다.</strong>
          </p>
        </section>

        <section>
          <h2>5. 개인정보 처리의 위탁</h2>
          <p>서비스는 안정적인 운영을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
          <div className="legal-doc__table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">수탁자</th>
                  <th scope="col">위탁 업무</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Supabase, Inc. / Amazon Web Services</td>
                  <td>회원 인증, 데이터베이스 저장 및 운영</td>
                </tr>
                <tr>
                  <td>Vercel, Inc.</td>
                  <td>웹 서비스 호스팅, API 실행, 접속·보안 로그 처리</td>
                </tr>
                <tr>
                  <td>Google LLC</td>
                  <td>방문 통계 분석(Google Analytics)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            위탁 계약 시 개인정보의 안전한 관리에 관한 사항을 규정하고 있으며, 수탁자가 변경되는
            경우 본 처리방침을 통해 공개합니다.
          </p>
        </section>

        <section>
          <h2>6. 개인정보의 국외 이전</h2>
          <p>
            서비스는 「개인정보 보호법」 제28조의8 제1항 제3호에 따라, 계약의 이행과 이용자 편의
            증진을 위해 필요한 범위에서 다음과 같이 개인정보를 국외로 이전하고 있으며 그 내용을 본
            처리방침을 통해 공개합니다.
          </p>
          <div className="legal-doc__table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">이전받는 자</th>
                  <th scope="col">이전 국가·시점·방법</th>
                  <th scope="col">이전 항목 및 목적</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Supabase, Inc. / Amazon Web Services</td>
                  <td>
                    데이터는 대한민국 서울 리전(ap-northeast-2)에 저장됩니다. 다만 기술 지원 및 장애
                    대응 과정에서 미국 등 국외에서 접근이 이루어질 수 있으며, 서비스 이용 시점에
                    네트워크를 통해 전송됩니다.
                  </td>
                  <td>회원 정보, 가계부·투자·문의 기록 / 인증 및 데이터 보관</td>
                </tr>
                <tr>
                  <td>Vercel, Inc.</td>
                  <td>
                    미국 등 Vercel이 운영하는 글로벌 인프라. 서비스 이용 시점에 네트워크를 통해
                    전송됩니다.
                  </td>
                  <td>접속 IP, 브라우저·기기 정보, 요청 기록 / 호스팅 및 보안 운영</td>
                </tr>
                <tr>
                  <td>Google LLC</td>
                  <td>미국. 분석 도구가 동작하는 시점에 네트워크를 통해 전송됩니다.</td>
                  <td>방문 페이지, 유입 경로, 기기·브라우저 정보 / 방문 통계 분석</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            이용자는 개인정보의 국외 이전을 거부할 수 있습니다. 다만 이전을 거부하는 경우 회원
            가입과 서비스 이용이 제한될 수 있으며, 거부 의사는 아래 연락처로 전달해 주시기 바랍니다.
          </p>
        </section>

        <section>
          <h2>7. 개인정보의 파기 절차 및 방법</h2>
          <p>
            서비스는 보유 기간이 지나거나 처리 목적이 달성되면 지체 없이 해당 개인정보를 파기합니다.
          </p>
          <ul>
            <li>
              파기 절차: 탈퇴 또는 삭제 요청을 접수하면 대상 정보를 확인한 뒤 복구할 수 없도록
              삭제합니다.
            </li>
            <li>파기 방법: 전자적 파일 형태의 정보는 재생할 수 없는 기술적 방법으로 영구 삭제합니다.</li>
          </ul>
        </section>

        <section>
          <h2>8. 이용자와 법정대리인의 권리 및 행사 방법</h2>
          <p>
            이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요구할 수 있습니다.
            서비스 내 화면에서 직접 수정할 수 있는 항목은 이용자가 직접 처리할 수 있으며, 그 밖의
            요청은 아래 연락처로 접수해 주시기 바랍니다.
          </p>
          <p>
            요청을 받으면 지체 없이 조치하고 그 결과를 회신합니다. 이용자의 대리인이 요청하는 경우
            위임 사실을 확인할 수 있는 서류를 요구할 수 있습니다.
          </p>
          <p className="legal-doc__callout">
            접수 창구: <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
          </p>
        </section>

        <section>
          <h2>9. 만 {LEGAL_MINIMUM_AGE}세 미만 아동의 개인정보</h2>
          <p>
            서비스는 만 {LEGAL_MINIMUM_AGE}세 이상만 이용할 수 있으며, 회원 가입 시 연령 요건을
            확인합니다. 만 {LEGAL_MINIMUM_AGE}세 미만 아동의 개인정보가 수집된 사실을 알게 된 경우
            지체 없이 해당 정보를 파기합니다.
          </p>
        </section>

        <section>
          <h2>10. 개인정보 자동 수집 장치의 설치·운영 및 거부</h2>
          <p>
            서비스는 로그인 상태를 유지하기 위한 인증 쿠키를 사용합니다. 이 쿠키는 서비스 제공에
            반드시 필요하며, 거부하면 로그인이 유지되지 않습니다.
          </p>
          <p>
            또한 서비스 개선을 위해 방문 통계 분석 도구(Google Analytics, Vercel Analytics 및 Speed
            Insights)를 사용하며, 이 과정에서 방문 페이지, 유입 경로, 기기·브라우저 정보와 성능
            측정값이 수집됩니다. 이 정보는 특정 개인을 식별하는 목적으로 이용되지 않습니다.
          </p>
          <p>
            분석 목적의 수집은 브라우저 설정에서 쿠키를 차단하거나 Google이 제공하는 차단 도구를
            설치해 거부할 수 있습니다. 다만 인증 쿠키까지 함께 차단하면 서비스 이용이 제한될 수
            있습니다.
          </p>
        </section>

        <section>
          <h2>11. 개인정보의 안전성 확보 조치</h2>
          <ul>
            <li>비밀번호는 복호화할 수 없는 형태로 암호화하여 저장합니다.</li>
            <li>
              데이터베이스에 행 수준 보안(RLS)을 적용해 이용자가 자신의 데이터에만 접근하도록
              제한합니다.
            </li>
            <li>모든 통신 구간에 HTTPS 암호화를 적용합니다.</li>
            <li>보안 정책(CSP) 위반을 기록해 이상 징후를 점검합니다.</li>
            <li>개인정보에 접근할 수 있는 권한을 운영에 필요한 최소한으로 제한합니다.</li>
          </ul>
        </section>

        <section>
          <h2>12. 개인정보 보호책임자</h2>
          <p>
            서비스는 개인정보 처리에 관한 업무를 총괄하고 이용자의 문의와 피해 구제를 처리하기 위해
            개인정보 보호책임자를 지정하고 있습니다. 개인정보 열람 청구도 같은 창구로 접수합니다.
          </p>
          <ul>
            <li>운영자: {LEGAL_OPERATOR_NAME}</li>
            <li>개인정보 보호책임자: {LEGAL_PRIVACY_OFFICER_NAME}</li>
            <li>
              연락처: <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
            </li>
          </ul>
        </section>

        <section>
          <h2>13. 권익침해 구제 방법</h2>
          <p>
            이용자는 개인정보 침해로 인한 구제를 받기 위하여 아래 기관에 분쟁 해결이나 상담을 신청할
            수 있습니다.
          </p>
          <ul>
            <li>개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)</li>
            <li>개인정보침해신고센터: 국번 없이 118 (privacy.kisa.or.kr)</li>
            <li>대검찰청 사이버수사과: 국번 없이 1301 (www.spo.go.kr)</li>
            <li>경찰청 사이버수사국: 국번 없이 182 (ecrm.police.go.kr)</li>
          </ul>
        </section>

        <section>
          <h2>14. 처리방침의 변경</h2>
          <p>
            본 처리방침의 내용이 추가, 삭제, 수정되는 경우 변경 사항의 시행 최소 7일 전부터 서비스
            화면을 통해 공지합니다. 다만 이용자의 권리에 중대한 변경이 발생하는 경우에는 최소 30일
            전에 공지하고 필요한 경우 다시 동의를 받습니다.
          </p>
          <p>본 개인정보 처리방침은 {CURRENT_PRIVACY_VERSION}부터 시행됩니다.</p>
        </section>

        <nav className="legal-doc__nav" aria-label="관련 문서">
          <Link href="/legal/terms">이용약관 보기</Link>
        </nav>
      </article>
    </main>
  );
}
