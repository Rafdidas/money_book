"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import safe from "@/assets/img/renewal/safe.svg";
import { disableDemoMode, enableDemoMode } from "@/lib/demo";
import { setRememberLogin } from "@/lib/supabase/auth-storage";
import { getAuthenticatedDestination } from "@/app/providers";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberLogin, setRememberLoginState] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const redirectIfLoggedIn = async () => {
      try {
        const destination = await getAuthenticatedDestination();

        if (!isCancelled && destination !== "/auth/login") {
          router.replace(destination);
        }
      } catch {
        if (!isCancelled) {
          setPasswordError("로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
        }
      }
    };

    redirectIfLoggedIn();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    let nextEmailError = "";
    let nextPasswordError = "";

    if (!trimmedEmail) {
      nextEmailError = "이메일을 입력해주세요.";
    }

    if (!password) {
      nextPasswordError = "비밀번호를 입력해주세요.";
    }

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextEmailError || nextPasswordError) {
      return;
    }

    try {
      setIsSubmitting(true);
      setRememberLogin(rememberLogin);

      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setRememberLogin(false);
        formRef.current?.reset();
        setEmail("");
        setPassword("");
        setPasswordError("이메일 또는 비밀번호를 확인해주세요.");
        alert(`로그인 실패: ${error.message}`);
        return;
      }

      disableDemoMode();
      formRef.current?.reset();
      setEmail("");
      setPassword("");
      router.replace(await getAuthenticatedDestination());
      router.refresh();
    } catch {
      setPasswordError("로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
      router.replace("/auth/login");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = () => {
    enableDemoMode();
    router.replace("/app");
    router.refresh();
  };

  return (
    <div className="auth-page auth-page--login">
      <main className="auth-shell" aria-labelledby="login-title">
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
                돈의 흐름,
                <br />
                가볍게 정리해요
              </h2>
              <p>수입·지출·저축·투자까지, 흩어진 돈의 흐름을 머니북 하나로 모아서 봐요.</p>
              <Image src={safe} width={340} height={314} alt="" priority />
            </div>
            <p className="auth-side__foot">개인 가계부 서비스</p>
          </aside>

          <section className="auth-panel">
            <div className="auth-form-wrap auth-form-wrap--login">
              <h1 id="login-title" className="auth-title">
                로그인
              </h1>
              <p className="auth-subtitle">머니북 계정으로 로그인해요</p>

              <form ref={formRef} className="auth-form" onSubmit={handleLogin}>
                <div className="auth-field">
                  <label htmlFor="login-email">이메일</label>
                  <input
                    className={emailError ? "auth-input is-invalid" : "auth-input"}
                    id="login-email"
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

                <div className="auth-field auth-field--login-password">
                  <label htmlFor="login-password">비밀번호</label>
                  <input
                    className={passwordError ? "auth-input is-invalid" : "auth-input"}
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    autoComplete="current-password"
                    aria-invalid={Boolean(passwordError)}
                    disabled={isSubmitting}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (passwordError) {
                        setPasswordError("");
                      }
                    }}
                  />
                  {passwordError ? <p className="auth-error-text">{passwordError}</p> : null}
                </div>

                <div className="auth-login-options">
                  <label className="auth-check">
                    <input
                      type="checkbox"
                      checked={rememberLogin}
                      disabled={isSubmitting}
                      onChange={(event) => setRememberLoginState(event.target.checked)}
                    />
                    로그인 유지
                  </label>
                  <span className="auth-muted-action">비밀번호 찾기</span>
                </div>

                <button type="submit" className="auth-submit" disabled={isSubmitting}>
                  {isSubmitting ? "로그인 중..." : "로그인"}
                </button>
                <button
                  type="button"
                  className="auth-demo-button"
                  onClick={handleDemoLogin}
                  disabled={isSubmitting}
                >
                  데모 체험하기
                </button>
                <p className="auth-bottom-link">
                  아직 계정이 없으신가요? <Link href="/auth/signup">회원가입</Link>
                </p>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
