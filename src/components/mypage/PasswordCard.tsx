"use client";

import { FormEvent, useState } from "react";

import { changePassword } from "@/lib/api/account";
import { PASSWORD_MISMATCH_MESSAGE, getPasswordError } from "@/lib/auth/password";

export default function PasswordCard({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearMessages = () => {
    if (error) setError("");
    if (notice) setNotice("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword) {
      setNotice("");
      setError("현재 비밀번호를 입력해주세요.");
      return;
    }

    // 재설정 화면과 같은 순서로 판단한다. 규칙 위반이 먼저, 그다음 불일치.
    const ruleError =
      getPasswordError(newPassword) ||
      (newPassword === confirmPassword ? "" : PASSWORD_MISMATCH_MESSAGE);

    if (ruleError) {
      setNotice("");
      setError(ruleError);
      return;
    }

    try {
      setError("");
      setNotice("");
      setIsSubmitting(true);

      const { otherSessionsRevoked } = await changePassword({
        email,
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice(
        otherSessionsRevoked
          ? "비밀번호를 변경했습니다. 다른 기기의 로그인은 모두 해제했습니다."
          : "비밀번호를 변경했습니다. 다른 기기의 로그인이 아직 해제되지 않았을 수 있습니다.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="card mypage-card column-group column-group--gap-16">
      <div>
        <h3 className="title--sm mypage-card--title">비밀번호 변경</h3>
        <p className="caption--md mypage-card--description">
          변경하면 다른 기기의 로그인은 모두 해제됩니다.
        </p>
      </div>

      <form className="column-group column-group--gap-16" noValidate onSubmit={handleSubmit}>
        <div className="mypage-field">
          <label htmlFor="mypage-current-password" className="label--md">
            현재 비밀번호
          </label>
          <input
            id="mypage-current-password"
            className="main-overview--control body--sm"
            type="password"
            value={currentPassword}
            autoComplete="current-password"
            disabled={isSubmitting}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
              clearMessages();
            }}
          />
        </div>

        <div className="mypage-field">
          <label htmlFor="mypage-new-password" className="label--md">
            새 비밀번호
          </label>
          <input
            id="mypage-new-password"
            className="main-overview--control body--sm"
            type="password"
            placeholder="영문과 숫자를 포함해 8자 이상"
            value={newPassword}
            autoComplete="new-password"
            disabled={isSubmitting}
            onChange={(event) => {
              setNewPassword(event.target.value);
              clearMessages();
            }}
          />
        </div>

        <div className="mypage-field">
          <label htmlFor="mypage-confirm-password" className="label--md">
            새 비밀번호 확인
          </label>
          <input
            id="mypage-confirm-password"
            className="main-overview--control body--sm"
            type="password"
            value={confirmPassword}
            autoComplete="new-password"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "mypage-password-error" : undefined}
            disabled={isSubmitting}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              clearMessages();
            }}
          />
          {error ? (
            <p id="mypage-password-error" className="caption--md mypage-error" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="caption--md color-gray" role="status">
              {notice}
            </p>
          ) : null}
        </div>

        <button type="submit" className="button button--primary button--md" disabled={isSubmitting}>
          {isSubmitting ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </section>
  );
}
