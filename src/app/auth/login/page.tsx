"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import safe from "@/assets/img/renewal/safe.svg";
import Checkbox from "@/components/common/Checkbox";
import { disableDemoMode, enableDemoMode } from "@/lib/demo";
import { setRememberLogin } from "@/lib/supabase/auth-storage";
import { getAuthenticatedDestination } from "@/app/providers";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const hasStartedLogin = useRef(false);
  const loginInFlight = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<"idle" | "authenticating" | "navigating">("idle");
  const isSubmitting = phase !== "idle";
  const [isSlow, setIsSlow] = useState(false);
  const [rememberLogin, setRememberLoginState] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!isSubmitting) return;
    const timer = window.setTimeout(() => setIsSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, [isSubmitting]);

  useEffect(() => {
    let isCancelled = false;

    const redirectIfLoggedIn = async () => {
      try {
        const destination = await getAuthenticatedDestination();

        if (!isCancelled && !hasStartedLogin.current && destination !== "/auth/login") {
          loginInFlight.current = true;
          setPhase("navigating");
          router.replace(destination);
        }
      } catch {
        if (!isCancelled && !hasStartedLogin.current) {
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
    if (loginInFlight.current) return;

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
      hasStartedLogin.current = true;
      loginInFlight.current = true;
      setIsSlow(false);
      setPhase("authenticating");
      setRememberLogin(rememberLogin);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setRememberLogin(false);
        setPasswordError("이메일 또는 비밀번호를 확인해주세요.");
        loginInFlight.current = false;
        setPhase("idle");
        return;
      }

      if (!data.user) throw new Error("Missing authenticated user");
      disableDemoMode();
      setPhase("navigating");
      const destination = await getAuthenticatedDestination(data.user);
      if (destination === "/auth/login") throw new Error("Missing destination");
      router.replace(destination);
    } catch {
      setPasswordError("로그인을 완료하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해주세요.");
      loginInFlight.current = false;
      setPhase("idle");
    }
  };

  const handleDemoLogin = () => {
    if (loginInFlight.current) return;
    hasStartedLogin.current = true;
    loginInFlight.current = true;
    setIsSlow(false);
    setPhase("navigating");
    enableDemoMode();
    router.replace("/app");
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

              <form className="auth-form" onSubmit={handleLogin}>
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
                  <p className="auth-field__hint">가입하신 이메일이 아이디입니다.</p>
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
                  {passwordError ? <p className="auth-error-text" role="alert">{passwordError}</p> : null}
                </div>

                <div className="auth-login-options">
                  <Checkbox
                    checked={rememberLogin}
                    disabled={isSubmitting}
                    onChange={setRememberLoginState}
                  >
                    로그인 유지
                  </Checkbox>
                  <Link href="/auth/forgot-password" className="auth-muted-action">
                    비밀번호 찾기
                  </Link>
                </div>

                <button type="submit" className="auth-submit auth-submit--login" disabled={isSubmitting} aria-busy={isSubmitting}>
                  {isSubmitting ? <span className="auth-button-spinner" aria-hidden="true" /> : null}
                  {phase === "navigating" ? "화면 이동 중..." : isSubmitting ? "로그인 중..." : "로그인"}
                </button>
                <button
                  type="button"
                  className="auth-demo-button"
                  onClick={handleDemoLogin}
                  disabled={isSubmitting}
                >
                  데모 체험하기
                </button>
                <p className="auth-login-status" role="status" aria-live="polite" aria-atomic="true">
                  {isSubmitting
                    ? isSlow
                      ? "평소보다 시간이 걸리고 있어요. 잠시만 기다려주세요."
                      : phase === "navigating"
                        ? "화면을 준비하고 있어요. 잠시만 기다려주세요."
                        : "로그인 정보를 확인하고 있어요."
                    : ""}
                </p>
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
