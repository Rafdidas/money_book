"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, ReactNode, Suspense, useEffect, useState } from "react";

import safe from "@/assets/img/renewal/safe.svg";
import {
  PASSWORD_MISMATCH_MESSAGE,
  getPasswordError,
} from "@/lib/auth/password";
import { consumeAuthHashSession } from "@/lib/supabase/auth-url";
import { supabase } from "@/lib/supabase/client";

type RecoveryStatus = "verifying" | "ready" | "expired" | "done";

function ResetPasswordShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page auth-page--login">
      <main className="auth-shell" aria-labelledby="reset-password-title">
        <div className="auth-card-shell">
          <aside className="auth-side" aria-label="머니북가계부 소개">
            <div className="auth-side__orb auth-side__orb--top" aria-hidden="true" />
            <div className="auth-side__orb auth-side__orb--bottom" aria-hidden="true" />
            <Link href="/" className="auth-side__brand" aria-label="머니북가계부 홈">
              <span className="auth-side__mark">M</span>
              <span>머니북가계부</span>
            </Link>
            <div className="auth-side__content">
              <h2>
                새 비밀번호를
                <br />
                설정해요
              </h2>
              <p>변경하면 다른 기기에 남아 있던 로그인은 모두 해제됩니다.</p>
              <Image src={safe} width={340} height={314} alt="" priority />
            </div>
            <p className="auth-side__foot">개인 가계부 서비스</p>
          </aside>

          <section className="auth-panel">
            <div className="auth-form-wrap auth-form-wrap--login">{children}</div>
          </section>
        </div>
      </main>
    </div>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<RecoveryStatus>("verifying");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    // 링크는 해시(#access_token)로도, 쿼리(?code)로도 도착할 수 있고,
    // detectSessionInUrl이 켜져 있어 SDK가 이미 소비했을 수도 있다.
    // 그래서 각 호출의 성공 여부가 아니라 최종 세션 존재 여부로 판단한다.
    const establishSession = async () => {
      const code = searchParams.get("code");

      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch {
          // 이미 소비된 코드일 수 있다. 아래 getSession으로 판단한다.
        }
      } else {
        try {
          await consumeAuthHashSession();
        } catch {
          // 만료되었거나 이미 사용된 링크. 아래 getSession으로 판단한다.
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isCancelled) {
        return;
      }

      setStatus(session ? "ready" : "expired");
    };

    establishSession();

    return () => {
      isCancelled = true;
    };
    // 세션 확인은 링크 진입 시 한 번만 수행한다. next/navigation의 실제
    // useSearchParams는 렌더마다 안정적인 참조를 반환하지만, 테스트 더블 등
    // 매 렌더마다 새 인스턴스를 주는 환경에서 searchParams를 의존성에 넣으면
    // 비밀번호 변경 성공 후에도 세션 재확인이 재실행되어 상태가 "ready"로
    // 되돌아갈 수 있다. 최초 진입 시점의 code 파라미터만 필요하므로 한 번만 실행한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const ruleError = getPasswordError(password);

    if (ruleError) {
      setPasswordError(ruleError);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError(PASSWORD_MISMATCH_MESSAGE);
      return;
    }

    try {
      setPasswordError("");
      setIsSubmitting(true);

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setPasswordError("비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      // 유출을 의심해 재설정하는 경우 다른 기기 세션이 살아 있으면 의미가 없다.
      await supabase.auth.signOut({ scope: "others" });

      setPassword("");
      setConfirmPassword("");
      setStatus("done");
    } catch {
      setPasswordError("비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "verifying") {
    return (
      <ResetPasswordShell>
        <h1 id="reset-password-title" className="auth-title">
          확인 중
        </h1>
        <p className="auth-subtitle">잠시만 기다려주세요.</p>
        <div className="auth-spinner" aria-label="링크 확인 중" />
      </ResetPasswordShell>
    );
  }

  if (status === "expired") {
    return (
      <ResetPasswordShell>
        <h1 id="reset-password-title" className="auth-title">
          링크가 만료되었어요
        </h1>
        <p className="auth-subtitle">
          재설정 링크는 발급 후 일정 시간이 지나면 사용할 수 없습니다. 다시 요청해주세요.
        </p>
        <Link href="/auth/forgot-password" className="auth-submit auth-submit--link">
          다시 요청하기
        </Link>
        <p className="auth-bottom-link">
          비밀번호가 기억나셨나요? <Link href="/auth/login">로그인</Link>
        </p>
      </ResetPasswordShell>
    );
  }

  if (status === "done") {
    return (
      <ResetPasswordShell>
        <h1 id="reset-password-title" className="auth-title">
          비밀번호가 변경되었습니다
        </h1>
        <p className="auth-subtitle">
          다른 기기에 남아 있던 로그인은 모두 해제했습니다.
        </p>
        <button
          type="button"
          className="auth-submit"
          onClick={() => {
            router.replace("/app");
          }}
        >
          머니북 시작하기
        </button>
      </ResetPasswordShell>
    );
  }

  return (
    <ResetPasswordShell>
      <h1 id="reset-password-title" className="auth-title">
        새 비밀번호 설정
      </h1>
      <p className="auth-subtitle">앞으로 사용할 비밀번호를 입력해주세요</p>

      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="reset-password-new">새 비밀번호</label>
          <input
            className={passwordError ? "auth-input is-invalid" : "auth-input"}
            id="reset-password-new"
            name="password"
            type="password"
            placeholder="영문과 숫자를 포함해 8자 이상"
            value={password}
            autoComplete="new-password"
            aria-invalid={Boolean(passwordError)}
            disabled={isSubmitting}
            onChange={(event) => {
              setPassword(event.target.value);
              if (passwordError) {
                setPasswordError("");
              }
            }}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="reset-password-confirm">새 비밀번호 확인</label>
          <input
            className={passwordError ? "auth-input is-invalid" : "auth-input"}
            id="reset-password-confirm"
            name="confirmPassword"
            type="password"
            placeholder="비밀번호를 한번 더 입력해주세요"
            value={confirmPassword}
            autoComplete="new-password"
            aria-invalid={Boolean(passwordError)}
            disabled={isSubmitting}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              if (passwordError) {
                setPasswordError("");
              }
            }}
          />
          {passwordError ? <p className="auth-error-text">{passwordError}</p> : null}
        </div>

        <button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </ResetPasswordShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <ResetPasswordShell>
          <h1 className="auth-title">확인 중</h1>
          <p className="auth-subtitle">잠시만 기다려주세요.</p>
          <div className="auth-spinner" aria-label="링크 확인 중" />
        </ResetPasswordShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
