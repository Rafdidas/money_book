"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

import { getAuthenticatedDestination } from "@/app/providers";
import Checkbox from "@/components/common/Checkbox";
import { recordCurrentLegalConsent } from "@/lib/api/legalConsent";
import { supabase } from "@/lib/supabase/client";

const CONSENT_ERROR = "모든 필수 약관에 동의해주세요.";
const STATUS_ERROR = "동의 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.";

export default function ConsentPage() {
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const termsCheckboxRef = useRef<HTMLInputElement>(null);
  const privacyCheckboxRef = useRef<HTMLInputElement>(null);
  const ageCheckboxRef = useRef<HTMLInputElement>(null);

  const focusFirstMissingChoice = () => {
    if (!termsAccepted) {
      termsCheckboxRef.current?.focus();
    } else if (!privacyAccepted) {
      privacyCheckboxRef.current?.focus();
    } else {
      ageCheckboxRef.current?.focus();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!termsAccepted || !privacyAccepted || !ageConfirmed) {
      setError(CONSENT_ERROR);
      focusFirstMissingChoice();
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await recordCurrentLegalConsent();

      const destination = await getAuthenticatedDestination();
      if (destination !== "/app") {
        setError(STATUS_ERROR);
        return;
      }

      router.replace("/app");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "동의 기록을 저장하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setError("");
      setIsSigningOut(true);
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      router.replace("/auth/login");
    } catch {
      setError("로그아웃하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleChoiceChange = (setChecked: (checked: boolean) => void, checked: boolean) => {
    setChecked(checked);
    if (error) setError("");
  };

  const allConsentsAccepted = termsAccepted && privacyAccepted && ageConfirmed;
  const isConsentPartiallyAccepted =
    !allConsentsAccepted && (termsAccepted || privacyAccepted || ageConfirmed);

  const handleToggleAllConsents = (accepted: boolean) => {
    setTermsAccepted(accepted);
    setPrivacyAccepted(accepted);
    setAgeConfirmed(accepted);
    if (error) setError("");
  };

  return (
    <div className="auth-page auth-page--consent">
      <main className="auth-shell" aria-labelledby="consent-title">
        <div className="auth-card-shell">
          <aside className="auth-side" aria-label="머니북가계부 약관 안내">
            <div className="auth-side__orb auth-side__orb--top" aria-hidden="true" />
            <div className="auth-side__orb auth-side__orb--bottom" aria-hidden="true" />
            <Link href="/" className="auth-side__brand" aria-label="머니북가계부 홈">
              <span className="auth-side__mark">M</span>
              <span>머니북가계부</span>
            </Link>
            <div className="auth-side__content auth-consent__side-content">
              <h2>안전한 기록을 위해<br />확인이 필요해요</h2>
              <p>변경된 약관과 개인정보 처리방침을 확인하고 동의해주세요.</p>
            </div>
            <p className="auth-side__foot">개인 가계부 서비스</p>
          </aside>

          <section className="auth-panel">
            <div className="auth-form-wrap auth-consent">
              <h1 id="consent-title" className="auth-title">약관 재동의</h1>
              <p className="auth-subtitle">서비스를 계속 이용하려면 필수 약관에 동의해주세요.</p>

              <form className="auth-form auth-consent__form" noValidate onSubmit={handleSubmit}>
                <fieldset className="auth-consent__choices auth-consent-field" aria-describedby={error ? "consent-error" : undefined} disabled={isSubmitting || isSigningOut}>
                  <legend>필수 약관 동의</legend>
                  <Checkbox
                    checked={allConsentsAccepted}
                    indeterminate={isConsentPartiallyAccepted}
                    onChange={handleToggleAllConsents}
                  >
                    전체 동의
                  </Checkbox>
                  <hr className="auth-consent-field__divider" />
                  <Checkbox
                    ref={termsCheckboxRef}
                    checked={termsAccepted}
                    required
                    invalid={Boolean(error && !termsAccepted)}
                    onChange={(next) => handleChoiceChange(setTermsAccepted, next)}
                  >
                    <Link href="/legal/terms">이용약관</Link>에 동의합니다. <em>(필수)</em>
                  </Checkbox>
                  <Checkbox
                    ref={privacyCheckboxRef}
                    checked={privacyAccepted}
                    required
                    invalid={Boolean(error && !privacyAccepted)}
                    onChange={(next) => handleChoiceChange(setPrivacyAccepted, next)}
                  >
                    <Link href="/legal/privacy">개인정보 처리방침</Link>에 동의합니다. <em>(필수)</em>
                  </Checkbox>
                  <Checkbox
                    ref={ageCheckboxRef}
                    checked={ageConfirmed}
                    required
                    invalid={Boolean(error && !ageConfirmed)}
                    onChange={(next) => handleChoiceChange(setAgeConfirmed, next)}
                  >
                    만 14세 이상입니다. <em>(필수)</em>
                  </Checkbox>
                </fieldset>

                {error ? <p id="consent-error" className="auth-error-text auth-consent__error" role="alert">{error}</p> : null}

                <button type="submit" className="auth-submit auth-consent__submit" disabled={isSubmitting || isSigningOut}>
                  {isSubmitting ? "동의 기록 저장 중..." : "동의하고 계속하기"}
                </button>
                <button type="button" className="auth-consent__signout" disabled={isSubmitting || isSigningOut} onClick={handleSignOut}>
                  {isSigningOut ? "로그아웃 중..." : "로그아웃"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
