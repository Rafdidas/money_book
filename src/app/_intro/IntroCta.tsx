"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAppData } from "@/app/providers";
import { enableDemoMode } from "@/lib/demo";

type IntroCtaProps = {
  placement: "header" | "hero" | "banner";
};

export default function IntroCta({ placement }: IntroCtaProps) {
  const router = useRouter();
  const { hasAppSession } = useAppData();

  const handleDemoLogin = () => {
    enableDemoMode();
    router.replace("/app");
    router.refresh();
  };

  if (placement === "header") {
    return (
      <div className="intro-header__actions">
        {hasAppSession ? (
          <Link href="/app" className="intro-button intro-button--header-primary">
            가계부로 이동
          </Link>
        ) : (
          <>
            <Link href="/auth/login" className="intro-button intro-button--header-ghost">
              로그인
            </Link>
            <Link href="/auth/signup" className="intro-button intro-button--header-primary">
              시작하기
            </Link>
          </>
        )}
      </div>
    );
  }

  if (placement === "banner") {
    return (
      <Link href={hasAppSession ? "/app" : "/auth/signup"} className="intro-button intro-button--banner">
        무료로 시작하기
      </Link>
    );
  }

  return (
    <div className="intro-hero__actions">
      <Link href={hasAppSession ? "/app" : "/auth/signup"} className="intro-button intro-button--primary">
        {hasAppSession ? "가계부로 이동" : "가계부 시작하기"}
      </Link>
      <button type="button" className="intro-button intro-button--secondary" onClick={handleDemoLogin}>
        데모 둘러보기
      </button>
    </div>
  );
}
