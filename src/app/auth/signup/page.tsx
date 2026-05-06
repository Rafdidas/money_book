"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getAuthCallbackUrl } from "@/lib/supabase/auth-url";
import { supabase } from "@/lib/supabase/client";

const getSignupErrorMessage = (message: string) => {
  if (message.includes("email rate limit exceeded")) {
    return "인증 메일 요청이 많습니다. 잠시 후 다시 시도해주세요.";
  }

  return message;
};

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

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

      setIsEmailSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="signup-ornament-left" />
      <div className="signup-ornament-right" />

      <main className="signup-stage">
        <section className="signup-wrap">
          <div className="auth-brand-block">
            <h1 className="auth-brand auth-brand-sm headline--sm">MONEY BOOK</h1>
            <p className="auth-lead">새로운 금융 여정을 시작하세요</p>
          </div>

          <section className="signup-card">
            {isEmailSent ? (
              <div className="auth-message">
                <div className="auth-brand-block">
                  <h1 className="auth-brand auth-brand-sm headline--sm">이메일 인증</h1>
                  <p className="auth-lead">
                    {email} 주소로 인증 메일을 보냈습니다.
                  </p>
                </div>
                <p className="body--md">
                  메일의 인증 링크를 누르면 로그인 상태로 전환됩니다. 메일이 보이지
                  않으면 스팸함도 확인해주세요.
                </p>
                <Link
                  href="/auth/login"
                  className="button button--primary button--lg button--full"
                >
                  로그인 페이지로 이동
                </Link>
              </div>
            ) : (
              <>
                <div className="auth-brand-block">
                  <h1 className="auth-brand auth-brand-sm headline--sm">Sign up</h1>
                  {/* <p className="auth-lead">새로운 금융 여정을 시작하세요</p> */}
                </div>
                <form className="auth-form" onSubmit={handleSignup}>
                  <div className="field-group">
                    <label className="field-label label--lg" htmlFor="signup-name">
                      이름
                    </label>
                    <input
                      className="form-input form-input--md"
                      id="signup-name"
                      name="name"
                      type="text"
                      placeholder="성함을 입력해주세요"
                      value={name}
                      autoComplete="name"
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label label--lg" htmlFor="signup-email">
                      이메일
                    </label>
                    <input
                      className="form-input form-input--md"
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="example@moneybook.com"
                      value={email}
                      autoComplete="email"
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label label--lg" htmlFor="signup-password">
                      비밀번호
                    </label>
                    <input
                      className="form-input form-input--md"
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="8자 이상 입력해주세요"
                      value={password}
                      autoComplete="new-password"
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (passwordError) {
                          setPasswordError("");
                        }
                      }}
                    />
                  </div>

                  <div className="field-group">
                    <label
                      className="field-label label--lg"
                      htmlFor="signup-confirm-password"
                    >
                      비밀번호 확인
                    </label>
                    <input
                      className="form-input form-input--md"
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="비밀번호를 한번 더 입력해주세요"
                      value={confirmPassword}
                      autoComplete="new-password"
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        if (passwordError) {
                          setPasswordError("");
                        }
                      }}
                    />
                  </div>

                  {passwordError ? (
                    <p className="error-text label--md">{passwordError}</p>
                  ) : null}
                  <button
                    type="submit"
                    className="button button--primary button--lg button--full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "가입 중..." : "회원가입"}
                  </button>
                </form>
              </>
            )}

            <div className="signup-footer ">
              <span className="body--md">이미 계정이 있으신가요?</span>
              <Link href="/auth/login" className="body--md">
                로그인 페이지로 돌아가기
              </Link>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
