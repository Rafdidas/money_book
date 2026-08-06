import Link from "next/link";

/**
 * 공개 문서로 가는 공용 링크.
 * 푸터와 인트로 화면이 같은 표기를 쓰도록 한 곳에서 관리한다.
 */
export default function LegalLinks({ className }: { className?: string }) {
  return (
    <nav className={className ? `legal-links ${className}` : "legal-links"} aria-label="약관 및 정책">
      <Link href="/legal/terms">이용약관</Link>
      <span aria-hidden="true">·</span>
      <Link href="/legal/privacy">개인정보 처리방침</Link>
    </nav>
  );
}
