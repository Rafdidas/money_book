"use client";

import TextField from "@mui/material/TextField";
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
                <TextField
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder="성함을 입력해주세요"
                  value={name}
                  autoComplete="name"
                  variant="outlined"
                  className="form-input"
                  onChange={(event) => setName(event.target.value)}
                  slotProps={{
                    htmlInput: {
                      className: "body--sm",
                    },
                  }}
                />
              </div>

              <div className="field-group">
                <label className="field-label label--sm" htmlFor="signup-email">
                  이메일
                </label>
                <TextField
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="example@moneybook.com"
                  value={email}
                  autoComplete="email"
                  variant="outlined"
                  className="form-input"
                  onChange={(event) => setEmail(event.target.value)}
                  slotProps={{
                    htmlInput: {
                      className: "body--sm",
                    },
                  }}
                />
              </div>

              <div className="field-group">
                <label className="field-label label--sm" htmlFor="signup-password">
                  비밀번호
                </label>
                <TextField
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder="8자 이상 입력해주세요"
                  value={password}
                  autoComplete="new-password"
                  variant="outlined"
                  className="form-input"
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (passwordError) {
                      setPasswordError("");
                    }
                  }}
                  slotProps={{
                    htmlInput: {
                      className: "body--sm",
                    },
                  }}
                />
              </div>

              <div className="field-group">
                <label
                  className="field-label label--sm"
                  htmlFor="signup-confirm-password"
                >
                  비밀번호 확인
                </label>
                <TextField
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="비밀번호를 한번 더 입력해주세요"
                  value={confirmPassword}
                  autoComplete="new-password"
                  variant="outlined"
                  className="form-input"
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    if (passwordError) {
                      setPasswordError("");
                    }
                  }}
                  slotProps={{
                    htmlInput: {
                      className: "body--sm",
                    },
                  }}
                />
              </div>

              {passwordError ? (
                <p className="error-text label--md">{passwordError}</p>
              ) : null}

              <button
                type="button"
                className="button bodyBold--sm"
                onClick={handleSignup}
                disabled={isSubmitting}
              >
                {isSubmitting ? "회원가입 중..." : "회원가입"}
              </button>
            </div>

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
