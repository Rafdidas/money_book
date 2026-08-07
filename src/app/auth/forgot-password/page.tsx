"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import safe from "@/assets/img/renewal/safe.svg";
import { getResetPasswordUrl } from "@/lib/supabase/auth-url";
import { supabase } from "@/lib/supabase/client";

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => setCooldown(cooldown - 1), 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const sendResetMail = async (targetEmail: string) => {
    try {
      setIsSubmitting(true);

      // 오류를 사용자에게 구분해 알리지 않는다. 가입 여부가 노출되면
      // 계정 열거 창구가 된다.
      await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: getResetPasswordUrl(),
      });
    } catch {
      // 네트워크 오류도 동일하게 취급한다.
    } finally {
      setSentEmail(targetEmail);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("이메일을 입력해주세요.");
      return;
    }

    setEmailError("");
    await sendResetMail(trimmedEmail);
  };

  return (
    <div className="auth-page auth-page--login">
      <main className="auth-shell" aria-labelledby="forgot-password-title">
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
                비밀번호를
                <br />
                잊으셨나요?
              </h2>
              <p>가입하신 이메일로 재설정 링크를 보내드려요. 기록은 그대로 남아 있어요.</p>
              <Image src={safe} width={340} height={314} alt="" priority />
            </div>
            <p className="auth-side__foot">개인 가계부 서비스</p>
          </aside>

          <section className="auth-panel">
            <div className="auth-form-wrap auth-form-wrap--login">
              {sentEmail ? (
                <>
                  <h1 id="forgot-password-title" className="auth-title">
                    메일을 보냈습니다
                  </h1>
                  <p className="auth-subtitle">
                    {sentEmail}로 재설정 링크를 보냈습니다. 도착하지 않으면 스팸함을
                    확인해주세요.
                  </p>
                  <Link href="/auth/login" className="auth-submit auth-submit--link">
                    로그인으로 돌아가기
                  </Link>
                  <button
                    type="button"
                    className="auth-demo-button"
                    disabled={cooldown > 0 || isSubmitting}
                    onClick={() => sendResetMail(sentEmail)}
                  >
                    {cooldown > 0 ? `다시 보내기 (${cooldown}초)` : "다시 보내기"}
                  </button>
                </>
              ) : (
                <>
                  <h1 id="forgot-password-title" className="auth-title">
                    비밀번호 찾기
                  </h1>
                  <p className="auth-subtitle">가입하신 이메일로 재설정 링크를 보내드립니다</p>

                  <form className="auth-form" noValidate onSubmit={handleSubmit}>
                    <div className="auth-field">
                      <label htmlFor="forgot-password-email">이메일</label>
                      <input
                        className={emailError ? "auth-input is-invalid" : "auth-input"}
                        id="forgot-password-email"
                        name="email"
                        type="email"
                        placeholder="example@moneybook.com"
                        value={email}
                        autoComplete="email"
                        aria-invalid={Boolean(emailError)}
                        disabled={isSubmitting}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (emailError) {
                            setEmailError("");
                          }
                        }}
                      />
                      {emailError ? <p className="auth-error-text">{emailError}</p> : null}
                    </div>

                    <button type="submit" className="auth-submit" disabled={isSubmitting}>
                      {isSubmitting ? "전송 중..." : "재설정 링크 받기"}
                    </button>
                    <p className="auth-bottom-link">
                      비밀번호가 기억나셨나요? <Link href="/auth/login">로그인</Link>
                    </p>
                  </form>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
