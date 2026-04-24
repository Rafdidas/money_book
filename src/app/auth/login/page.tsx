"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const redirectIfLoggedIn = async () => {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        router.replace("/");
      }
    };

    redirectIfLoggedIn();
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

      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        formRef.current?.reset();
        setEmail("");
        setPassword("");
        setPasswordError("이메일 또는 비밀번호를 확인해주세요.");
        alert(`로그인 실패: ${error.message}`);
        return;
      }

      formRef.current?.reset();
      setEmail("");
      setPassword("");
      router.replace("/");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page auth-page-login">
      <div className="login-ornament-top" />
      <div className="login-ornament-bottom" />

      <main className="login-stage">
        <section className="login-wrap">
          <div className="auth-brand-block">
            <h1 className="auth-brand headline--md">MONEY BOOK</h1>
            <p className="auth-lead">당신의 자산 이야기를 기록합니다</p>
          </div>
          <section className="login-card">
            <div className="auth-brand-block">
              <h1 className="auth-brand headline--md">Sign in</h1>
              {/* <p className="auth-lead">당신의 자산 이야기를 기록합니다</p> */}
            </div>
            <form ref={formRef} className="auth-form" onSubmit={handleLogin}>
              <div className="field-group">
                <label className="field-label label--lg" htmlFor="login-email">
                  이메일
                </label>
                <input
                  className={`form-input form-input--md${emailError ? " form-input--invalid" : ""}`}
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
                {emailError ? (
                  <p className="form-input-helper form-input-helper--invalid">{emailError}</p>
                ) : null}
              </div>
              <div className="field-group">
                <label className="field-label label--lg" htmlFor="login-password">
                  비밀번호
                </label>
                <input
                  className={`form-input form-input--md${passwordError ? " form-input--invalid" : ""}`}
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
                {passwordError ? (
                  <p className="form-input-helper form-input-helper--invalid">{passwordError}</p>
                ) : null}
              </div>
              <div className="login-footer row-group row-group--between body--sm">
                <span>아직 회원이 아니신가요?</span>
                <Link href="/auth/signup" className="body--md">회원가입</Link>
              </div>
              <button
                type="submit"
                className="button button--primary button--lg button--full label--lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "로그인 중..." : "로그인"}
              </button>
            </form>
          </section>
        </section>
      </main>
    </div>
  );
}
