"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
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
          data: {
            name,
          },
        },
      });

      if (error) {
        alert(`회원가입 실패: ${error.message}`);
        return;
      }

      alert("회원가입 성공! 이메일을 확인해주세요.");
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
            <div className="auth-form">
              <div className="field-group">
                <label className="field-label label--sm" htmlFor="signup-name">
                  이름
                </label>
                <input
                  id="signup-name"
                  className="field-input body--sm"
                  type="text"
                  placeholder="성함을 입력해주세요"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label label--sm" htmlFor="signup-email">
                  이메일
                </label>
                <input
                  id="signup-email"
                  className="field-input body--sm"
                  type="email"
                  placeholder="example@moneybook.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label label--sm" htmlFor="signup-password">
                  비밀번호
                </label>
                <input
                  id="signup-password"
                  className="field-input body--sm"
                  type="password"
                  placeholder="8자 이상 입력해주세요"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (passwordError) {
                      setPasswordError("");
                    }
                  }}
                />
              </div>

              <div className="field-group">
                <label className="field-label label--sm" htmlFor="signup-confirm-password">
                  비밀번호 확인
                </label>
                <input
                  id="signup-confirm-password"
                  className="field-input body--sm"
                  type="password"
                  placeholder="비밀번호를 한번 더 입력해주세요"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    if (passwordError) {
                      setPasswordError("");
                    }
                  }}
                />
              </div>

              {passwordError ? <p className="error-text label--md">{passwordError}</p> : null}

              <button
                type="button"
                className="primary-rect-button bodyBold--sm"
                onClick={handleSignup}
                disabled={isSubmitting}
              >
                {isSubmitting ? "회원가입 중..." : "회원가입"}
              </button>
            </div>

            <div className="signup-footer caption--md">
              <span>이미 계정이 있으신가요?</span>
              <Link href="/auth/login">로그인 페이지로 돌아가기</Link>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
