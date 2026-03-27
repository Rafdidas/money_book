"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import styles from "../auth.module.scss";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");

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
        alert("회원가입 실패: " + error.message);
        return;
      }

      alert("회원가입 성공! 이메일 확인하세요");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authShell}>
      <main className={styles.signupStage}>
        <section className={styles.signupCard}>
          <aside className={styles.signupHero}>
            <div className={styles.signupHeroInner}>
              <Link href="/" className={styles.brandMark}>
                Money Book
              </Link>
              <h1 className={styles.signupHeroTitle}>
                재산의 흐름을
                <br />
                감각적으로 기록하다.
              </h1>
              <p className={styles.signupHeroText}>
                단순한 소비 기록을 넘어, 당신의 라이프스타일을 완성하는
                프리미엄 자산 관리 아틀리에.
              </p>
            </div>
            <div className={styles.signupHeroFooter} />
          </aside>

          <section className={styles.authPanel}>
            <div className={styles.authPanelInner}>
              <div className={styles.authHeader}>
                <h1 className={styles.authTitle}>회원가입</h1>
                <p className={styles.authSubtitle}>
                  Money Book과 함께 새로운 자산 관리 여정을 시작하세요.
                </p>
              </div>

              <div className={styles.authForm}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="signup-name">
                    성함
                  </label>
                  <input
                    id="signup-name"
                    className={styles.fieldInput}
                    type="text"
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="signup-email">
                    이메일 주소
                  </label>
                  <input
                    id="signup-email"
                    className={styles.fieldInput}
                    type="email"
                    placeholder="example@moneybook.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="signup-password">
                    비밀번호
                  </label>
                  <input
                    id="signup-password"
                    className={styles.fieldInput}
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) {
                        setPasswordError("");
                      }
                    }}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="signup-confirm-password">
                    비밀번호 확인
                  </label>
                  <input
                    id="signup-confirm-password"
                    className={styles.fieldInput}
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) {
                        setPasswordError("");
                      }
                    }}
                  />
                </div>

                {passwordError ? <p className={styles.errorText}>{passwordError}</p> : null}

                <div className={styles.authActions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleSignup}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "계정 생성 중..." : "계정 생성하기"}
                  </button>

                  <div className={styles.authLinkRow}>
                    <span>이미 계정이 있으신가요?</span>
                    <Link href="/auth/login">로그인으로 돌아가기</Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
