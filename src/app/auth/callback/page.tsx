"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { consumeAuthHashSession } from "@/lib/supabase/auth-url";
import { supabase } from "@/lib/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");

    let isCancelled = false;

    const confirmEmail = async () => {
      try {
        if (!code) {
          const hasHashSession = await consumeAuthHashSession();

          if (!hasHashSession) {
            setErrorMessage("인증 코드가 없거나 만료된 링크입니다.");
            return;
          }

          router.replace("/app");
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (isCancelled) return;

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        router.replace("/app");
      } catch (error) {
        if (isCancelled) return;
        setErrorMessage(
          error instanceof Error ? error.message : "인증 처리 중 오류가 발생했습니다.",
        );
      }
    };

    confirmEmail();

    return () => {
      isCancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="auth-page">
      <main className="signup-stage">
        <section className="signup-wrap">
          <div className="auth-brand-block">
            <h1 className="auth-brand auth-brand-sm headline--sm">MONEY BOOK</h1>
            <p className="auth-lead">이메일 인증을 확인하고 있습니다</p>
          </div>

          <section className="signup-card">
            <div className="auth-message">
              <div className="auth-brand-block">
                <h1 className="auth-brand auth-brand-sm headline--sm">
                  {errorMessage ? "인증 실패" : "인증 중"}
                </h1>
                <p className="auth-lead">
                  {errorMessage
                    ? "메일 링크를 다시 확인해주세요."
                    : "잠시만 기다려주세요."}
                </p>
              </div>

              {errorMessage ? (
                <>
                  <p className="error-text label--md">{errorMessage}</p>
                  <Link
                    href="/auth/login"
                    className="button button--primary button--lg button--full"
                  >
                    로그인 페이지로 이동
                  </Link>
                </>
              ) : (
                <div className="auth-spinner" aria-label="인증 처리 중" />
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackFallback() {
  return (
    <div className="auth-page">
      <main className="signup-stage">
        <section className="signup-wrap">
          <div className="auth-brand-block">
            <h1 className="auth-brand auth-brand-sm headline--sm">MONEY BOOK</h1>
            <p className="auth-lead">이메일 인증을 확인하고 있습니다</p>
          </div>

          <section className="signup-card">
            <div className="auth-message">
              <div className="auth-brand-block">
                <h1 className="auth-brand auth-brand-sm headline--sm">인증 중</h1>
                <p className="auth-lead">잠시만 기다려주세요.</p>
              </div>
              <div className="auth-spinner" aria-label="인증 처리 중" />
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
