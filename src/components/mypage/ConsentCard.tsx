"use client";

import Link from "next/link";

import type { AccountOverview } from "@/lib/api/account";

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const describeConsent = (version: string | null, agreedAt: string | null) => {
  // 동의 이력을 남기기 전에 가입한 계정은 값이 비어 있다. 오류가 아니다.
  if (!version && !agreedAt) {
    return "기록 없음";
  }

  const parts = [];

  if (version) parts.push(`${version} 버전`);
  if (agreedAt) parts.push(`${formatDateTime(agreedAt)} 동의`);

  return parts.join(" · ");
};

export default function ConsentCard({ overview }: { overview: AccountOverview }) {
  return (
    <section className="card mypage-card column-group column-group--gap-16">
      <div>
        <h3 className="title--sm mypage-card--title">약관 동의 현황</h3>
        <p className="caption--md mypage-card--description">
          동의한 문서와 시점을 확인할 수 있습니다.
        </p>
      </div>

      <div className="mypage-field">
        <Link href="/legal/terms" className="label--md">
          이용약관
        </Link>
        <p className="body--sm mypage-readonly">
          {describeConsent(overview.termsVersion, overview.termsAgreedAt)}
        </p>
      </div>

      <div className="mypage-field">
        <Link href="/legal/privacy" className="label--md">
          개인정보 처리방침
        </Link>
        <p className="body--sm mypage-readonly">
          {describeConsent(overview.privacyVersion, overview.privacyAgreedAt)}
        </p>
      </div>

      <div className="mypage-field">
        <span className="label--md">만 14세 이상 확인</span>
        <p className="body--sm mypage-readonly">
          {overview.ageConfirmedAt ? `${formatDateTime(overview.ageConfirmedAt)} 확인` : "기록 없음"}
        </p>
      </div>
    </section>
  );
}
