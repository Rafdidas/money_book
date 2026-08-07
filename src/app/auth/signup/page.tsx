"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

import rocket from "@/assets/img/renewal/rocket.svg";
import Checkbox from "@/components/common/Checkbox";
import { disableDemoMode } from "@/lib/demo";
import {
  CURRENT_PRIVACY_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/lib/legal/legalDocuments";
import { PASSWORD_MISMATCH_MESSAGE, getPasswordError } from "@/lib/auth/password";
import { getAuthCallbackUrl } from "@/lib/supabase/auth-url";
import { supabase } from "@/lib/supabase/client";

const getSignupErrorMessage = (message: string) => {
  if (message.includes("email rate limit exceeded")) {
    return "인증 메일 요청이 많습니다. 잠시 후 다시 시도해주세요.";
  }

  // 동의 메타데이터가 없거나 잘못되면 `handle_new_user_profile` 트리거가 가입을
  // 되돌리고 Supabase는 원문 오류를 그대로 반환한다. 화면 검증을 통과한 정상
  // 경로에서는 나오지 않지만, DB 문구가 사용자에게 노출되지 않도록 매핑한다.
  if (
    message.includes("Database error saving new user") ||
    message.includes("Terms, privacy, and age confirmation are required") ||
    message.includes("version is required") ||
    message.includes("version is too long")
  ) {
    return "약관 동의 정보를 확인하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.";
  }

  return message;
};

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [legalConsentError, setLegalConsentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const termsCheckboxRef = useRef<HTMLInputElement>(null);
  const privacyCheckboxRef = useRef<HTMLInputElement>(null);
  const ageCheckboxRef = useRef<HTMLInputElement>(null);

  const allConsentsAccepted = termsAccepted && privacyAccepted && ageConfirmed;
  const isConsentPartiallyAccepted =
    !allConsentsAccepted && (termsAccepted || privacyAccepted || ageConfirmed);

  const handleConsentChange = (setAccepted: (accepted: boolean) => void, accepted: boolean) => {
    setAccepted(accepted);
    if (legalConsentError) setLegalConsentError("");
  };

  const handleToggleAllConsents = (accepted: boolean) => {
    setTermsAccepted(accepted);
    setPrivacyAccepted(accepted);
    setAgeConfirmed(accepted);
    if (legalConsentError) setLegalConsentError("");
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const nextNameError = trimmedName ? "" : "이름을 입력해주세요.";
    const nextEmailError = trimmedEmail ? "" : "이메일을 입력해주세요.";
    let nextPasswordError = "";

    if (!password || !confirmPassword) {
      nextPasswordError = "비밀번호를 입력해주세요.";
    } else {
      // 재설정 화면과 같은 순서로 판단한다. 규칙 위반이 먼저, 그다음 불일치.
      nextPasswordError =
        getPasswordError(password) ||
        (password === confirmPassword ? "" : PASSWORD_MISMATCH_MESSAGE);
    }

    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextNameError || nextEmailError || nextPasswordError) {
      return;
    }

    if (!termsAccepted || !privacyAccepted || !ageConfirmed) {
      setLegalConsentError("회원가입을 위해 모든 필수 약관에 동의해주세요.");

      if (!termsAccepted) {
        termsCheckboxRef.current?.focus();
      } else if (!privacyAccepted) {
        privacyCheckboxRef.current?.focus();
      } else {
        ageCheckboxRef.current?.focus();
      }

      return;
    }

    try {
      setNameError("");
      setEmailError("");
      setPasswordError("");
      setLegalConsentError("");
      setIsSubmitting(true);

      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          // 키 이름은 handle_new_user_profile 트리거가 읽는 이름과 반드시 같아야 한다.
          // (supabase/migrations/20260804000000_add_legal_consent.sql)
          data: {
            name: trimmedName,
            terms_agreed: true,
            privacy_agreed: true,
            age_confirmed: true,
            terms_version: CURRENT_TERMS_VERSION,
            privacy_version: CURRENT_PRIVACY_VERSION,
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

              <form className="auth-form auth-form--signup" noValidate onSubmit={handleSignup}>
                <div className="auth-field auth-field--signup">
                  <label htmlFor="signup-name">이름</label>
                  <input
                    className={nameError ? "auth-input auth-input--signup is-invalid" : "auth-input auth-input--signup"}
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="성함을 입력해주세요"
                    value={name}
                    autoComplete="name"
                    aria-invalid={Boolean(nameError)}
                    disabled={isSubmitting}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (nameError) {
                        setNameError("");
                      }
                    }}
                  />
                  {nameError ? <p className="auth-error-text">{nameError}</p> : null}
                </div>

                <div className="auth-field auth-field--signup">
                  <label htmlFor="signup-email">이메일</label>
                  <input
                    className={emailError ? "auth-input auth-input--signup is-invalid" : "auth-input auth-input--signup"}
                    id="signup-email"
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

                <div className="auth-field auth-field--signup">
                  <label htmlFor="signup-password">비밀번호</label>
                  <input
                    className={passwordError ? "auth-input auth-input--signup is-invalid" : "auth-input auth-input--signup"}
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="영문과 숫자를 포함해 8자 이상"
                    value={password}
                    autoComplete="new-password"
                    aria-invalid={Boolean(passwordError)}
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

                <fieldset className="auth-consent-field" aria-describedby={legalConsentError ? "signup-legal-consent-error" : undefined}>
                  <legend>필수 약관 동의</legend>
                  <Checkbox
                    checked={allConsentsAccepted}
                    indeterminate={isConsentPartiallyAccepted}
                    disabled={isSubmitting}
                    onChange={handleToggleAllConsents}
                  >
                    전체 동의
                  </Checkbox>
                  <hr className="auth-consent-field__divider" />
                  <Checkbox
                    ref={termsCheckboxRef}
                    name="termsAccepted"
                    checked={termsAccepted}
                    required
                    invalid={Boolean(legalConsentError && !termsAccepted)}
                    disabled={isSubmitting}
                    onChange={(next) => handleConsentChange(setTermsAccepted, next)}
                  >
                    <Link href="/legal/terms">이용약관</Link>에 동의합니다.
                  </Checkbox>
                  <Checkbox
                    ref={privacyCheckboxRef}
                    name="privacyAccepted"
                    checked={privacyAccepted}
                    required
                    invalid={Boolean(legalConsentError && !privacyAccepted)}
                    disabled={isSubmitting}
                    onChange={(next) => handleConsentChange(setPrivacyAccepted, next)}
                  >
                    <Link href="/legal/privacy">개인정보 처리방침</Link>에 동의합니다.
                  </Checkbox>
                  <Checkbox
                    ref={ageCheckboxRef}
                    name="ageConfirmed"
                    checked={ageConfirmed}
                    required
                    invalid={Boolean(legalConsentError && !ageConfirmed)}
                    disabled={isSubmitting}
                    onChange={(next) => handleConsentChange(setAgeConfirmed, next)}
                  >
                    만 14세 이상입니다.
                  </Checkbox>
                  {legalConsentError ? (
                    <p id="signup-legal-consent-error" className="auth-error-text" role="alert">
                      {legalConsentError}
                    </p>
                  ) : null}
                </fieldset>

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
