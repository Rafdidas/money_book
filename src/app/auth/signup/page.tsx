"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import rocket from "@/assets/img/renewal/rocket.svg";
import { disableDemoMode } from "@/lib/demo";
import { getAuthCallbackUrl } from "@/lib/supabase/auth-url";
import { supabase } from "@/lib/supabase/client";

const getSignupErrorMessage = (message: string) => {
  if (message.includes("email rate limit exceeded")) {
    return "인증 메일 요청이 많습니다. 잠시 후 다시 시도해주세요.";
  }

  return message;
};

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      alert("이름, 이메일, 비밀번호를 모두 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setPasswordError("");
      setIsSubmitting(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            name,
          },
        },
      });

      if (error) {
        alert(`회원가입 실패: ${getSignupErrorMessage(error.message)}`);
        return;
      }

      disableDemoMode();
      router.replace("/app");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page auth-page--signup">
      <main className="auth-shell" aria-labelledby="signup-title">
        <div className="auth-card-shell">
          <aside className="auth-side" aria-label="머니북가계부 시작 안내">
            <div className="auth-side__orb auth-side__orb--top" aria-hidden="true" />
            <div className="auth-side__orb auth-side__orb--bottom" aria-hidden="true" />
            <Link href="/" className="auth-side__brand" aria-label="머니북가계부 홈">
              <span className="auth-side__mark">M</span>
              <span>머니북가계부</span>
            </Link>
            <div className="auth-side__content">
              <h2>
                1분이면
                <br />
                시작할 수 있어요
              </h2>
              <p>가입하고 이번 달 현금흐름부터 기록해보세요.</p>
              <div className="auth-side__stats" aria-label="서비스 특징">
                <div>
                  <strong>무료</strong>
                  <span>기본 기능</span>
                </div>
                <div>
                  <strong>PC·모바일</strong>
                  <span>어디서나</span>
                </div>
              </div>
              <Image src={rocket} width={340} height={314} alt="" priority />
            </div>
            <p className="auth-side__foot">개인 가계부 서비스</p>
          </aside>

          <section className="auth-panel">
            <div className="auth-form-wrap auth-form-wrap--signup">
              <h1 id="signup-title" className="auth-title">
                회원가입
              </h1>
              <p className="auth-subtitle auth-subtitle--signup">무료로 머니북을 시작해요</p>

              <form className="auth-form auth-form--signup" onSubmit={handleSignup}>
                <div className="auth-field auth-field--signup">
                  <label htmlFor="signup-name">이름</label>
                  <input
                    className="auth-input auth-input--signup"
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="성함을 입력해주세요"
                    value={name}
                    autoComplete="name"
                    disabled={isSubmitting}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>

                <div className="auth-field auth-field--signup">
                  <label htmlFor="signup-email">이메일</label>
                  <input
                    className="auth-input auth-input--signup"
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="example@moneybook.com"
                    value={email}
                    autoComplete="email"
                    disabled={isSubmitting}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <div className="auth-field auth-field--signup">
                  <label htmlFor="signup-password">비밀번호</label>
                  <input
                    className="auth-input auth-input--signup"
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="8자 이상 입력해주세요"
                    value={password}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (passwordError) {
                        setPasswordError("");
                      }
                    }}
                  />
                </div>

                <div className="auth-field auth-field--signup auth-field--confirm-password">
                  <label htmlFor="signup-confirm-password">비밀번호 확인</label>
                  <input
                    className={passwordError ? "auth-input auth-input--signup is-invalid" : "auth-input auth-input--signup"}
                    id="signup-confirm-password"
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

                <button type="submit" className="auth-submit auth-submit--signup" disabled={isSubmitting}>
                  {isSubmitting ? "가입 중..." : "회원가입"}
                </button>
                <p className="auth-bottom-link auth-bottom-link--signup">
                  이미 계정이 있으신가요? <Link href="/auth/login">로그인</Link>
                </p>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
