"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppData } from "@/app/providers";
import { enableDemoMode } from "@/lib/demo";

type PublicCtaProps = {
  variant: "header" | "hero" | "banner";
};

export default function PublicCta({ variant }: PublicCtaProps) {
  const router = useRouter();
  const { hasAppSession } = useAppData();

  const handleDemoLogin = () => {
    enableDemoMode();
    router.replace("/app");
    router.refresh();
  };

  if (hasAppSession) {
    return (
      <Link
        href="/app"
        className={
          variant === "header"
            ? "button button--sm button--primary"
            : variant === "hero"
              ? "button button--lg button--primary"
              : "button button--md button--outline-primary"
        }
      >
        가계부로 이동
      </Link>
    );
  }

  if (variant === "banner") {
    return (
      <Link href="/auth/login" className="button button--md button--outline-primary">
        무료로 시작하기
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/auth/login"
        className={
          variant === "header"
            ? "button button--sm button--primary app-header__login"
            : "button button--lg button--primary"
        }
      >
        {variant === "header" ? "로그인" : "무료로 시작하기"}
      </Link>
      <button
        type="button"
        className={
          variant === "header"
            ? "button button--outline-primary button--sm"
            : "button button--lg button--outline-primary"
        }
        onClick={handleDemoLogin}
      >
        {variant === "header" ? "데모 버전" : "데모 버전 체험하기"}
      </button>
    </>
  );
}
