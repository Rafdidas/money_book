"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import styles from "../auth.module.scss";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
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
        alert("로그인 실패: " + error.message);
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authShellCompact}>
      <div className={styles.brandBar}>
        <Link href="/" className={styles.brandMark}>
          Money Book
        </Link>
      </div>

      <main className={styles.loginMain}>
        <div className={styles.loginFrame}>
          <div className={styles.loginIntro}>
            <h1 className={styles.authTitle}>로그인</h1>
            <p className={styles.authSubtitle}>
              자산의 흐름을 기록하고 새로운 재정적 시야를 확보하세요.
            </p>
          </div>

          <section className={styles.loginCard}>
            <div className={styles.authForm}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="login-email">
                  이메일
                </label>
                <input
                  id="login-email"
                  className={styles.fieldInput}
                  type="email"
                  placeholder="example@moneybook.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="login-password">
                  비밀번호
                </label>
                <input
                  id="login-password"
                  className={styles.fieldInput}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className={styles.loginActions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleLogin}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "로그인 중..." : "로그인"}
                </button>

                <div className={styles.dividerRow}>또는</div>

                <Link href="/auth/signup" className={styles.secondaryButton}>
                  회원가입
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className={styles.metaFooter}>
        © 2026 Money Book. All rights reserved. Precision in every transaction.
      </footer>
    </div>
  );
}
