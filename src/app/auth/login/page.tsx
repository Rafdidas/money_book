"use client";

import TextField from "@mui/material/TextField";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@mui/material";

export default function LoginPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      alert("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        formRef.current?.reset();
        setEmail("");
        alert(`로그인 실패: ${error.message}`);
        return;
      }

      formRef.current?.reset();
      setEmail("");
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
          <section className="login-card">
            <div className="auth-brand-block">
              <h1 className="auth-brand headline--md">MONEY BOOK</h1>
              <p className="auth-lead">당신의 자산 이야기를 기록합니다</p>
            </div>
            <form ref={formRef} className="auth-form" onSubmit={handleLogin}>
              <div className="field-group">
                <label className="field-label label--lg" htmlFor="login-email">
                  이메일
                </label>
                <TextField
                  id="login-email"
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
                      className: "body--lg",
                    },
                  }}
                />
              </div>

              <div className="field-group">
                <div className="label-row">
                  <label className="field-label label--lg" htmlFor="login-password">
                    비밀번호
                  </label>
                </div>

                <TextField
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  variant="outlined"
                  className="form-input"
                  slotProps={{
                    htmlInput: {
                      className: "body--lg",
                    },
                  }}
                />
              </div>
              <div className="login-footer body--sm">
                <span>아직 회원이 아니신가요?</span>
                <Link href="/auth/signup">회원가입</Link>
              </div>
              <Button
                type="submit"
                className="button button--full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          </section>
        </section>
      </main>
    </div>
  );
}
