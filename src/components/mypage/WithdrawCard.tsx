"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { deleteAccount } from "@/lib/api/account";

export default function WithdrawCard({ email }: { email: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);

      await deleteAccount({ email, password });

      // 성공 후에는 isSubmitting을 되돌리지 않는다. router.replace가 실제로
      // 반영되기 전에 버튼이 다시 활성화되면, 이미 삭제된 계정으로 중복 제출이
      // 발생해 혼란스러운 오류 메시지를 보여줄 수 있다.
      router.replace("/");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <section className="card mypage-card mypage-withdraw column-group column-group--gap-16">
      <div>
        <h3 className="title--sm mypage-card--title">회원 탈퇴</h3>
        <p className="caption--md mypage-card--description">
          계정과 기록을 모두 삭제합니다.
        </p>
      </div>

      {isOpen ? (
        <form className="column-group column-group--gap-16" noValidate onSubmit={handleSubmit}>
          <div className="mypage-withdraw--warning">
            <p className="body--sm">탈퇴하면 아래 정보가 모두 삭제됩니다.</p>
            <ul className="caption--md">
              <li>가계부 기록</li>
              <li>저축과 고정지출</li>
              <li>투자 내역</li>
              <li>문의 내역</li>
              <li>약관 동의 이력</li>
            </ul>
            <p className="body--sm">삭제한 정보는 복구할 수 없습니다.</p>
          </div>

          <div className="mypage-field">
            <label htmlFor="mypage-withdraw-password" className="label--md">
              비밀번호
            </label>
            <input
              id="mypage-withdraw-password"
              className="main-overview--control body--sm"
              type="password"
              value={password}
              autoComplete="current-password"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "mypage-withdraw-error" : undefined}
              disabled={isSubmitting}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError("");
              }}
            />
            {error ? (
              <p id="mypage-withdraw-error" className="caption--md mypage-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="row-group row-group--gap-8">
            <button type="submit" className="button button--negative button--primary button--md" disabled={isSubmitting}>
              {isSubmitting ? "처리 중..." : "탈퇴하기"}
            </button>
            <button
              type="button"
              className="button button--secondary button--md"
              disabled={isSubmitting}
              onClick={() => {
                setIsOpen(false);
                setPassword("");
                setError("");
              }}
            >
              취소
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="button button--secondary button--md"
          onClick={() => setIsOpen(true)}
        >
          회원 탈퇴
        </button>
      )}
    </section>
  );
}
