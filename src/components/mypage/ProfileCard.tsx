"use client";

import { FormEvent, useState } from "react";

import { updateDisplayName, type AccountOverview } from "@/lib/api/account";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

type ProfileCardProps = {
  overview: AccountOverview;
  onNameSaved: (name: string) => void;
};

export default function ProfileCard({ overview, onNameSaved }: ProfileCardProps) {
  const [name, setName] = useState(overview.name);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setNotice("");
      setError("이름을 입력해주세요.");
      return;
    }

    try {
      setError("");
      setNotice("");
      setIsSaving(true);

      const saved = await updateDisplayName(name);

      setName(saved);
      onNameSaved(saved);
      setNotice("이름을 저장했습니다.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "이름을 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="card mypage-card column-group column-group--gap-16">
      <div>
        <h3 className="title--sm mypage-card--title">내 정보</h3>
        <p className="caption--md mypage-card--description">
          이름은 화면에 표시되는 이름입니다.
        </p>
      </div>

      <form className="column-group column-group--gap-16" noValidate onSubmit={handleSubmit}>
        <div className="mypage-field">
          <label htmlFor="mypage-name" className="label--md">
            이름
          </label>
          <input
            id="mypage-name"
            className="main-overview--control body--sm"
            type="text"
            value={name}
            autoComplete="name"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "mypage-name-error" : undefined}
            disabled={isSaving}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError("");
              if (notice) setNotice("");
            }}
          />
          {error ? (
            <p id="mypage-name-error" className="caption--md mypage-error" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="caption--md color-gray" role="status">
              {notice}
            </p>
          ) : null}
        </div>

        <div className="mypage-field">
          <span className="label--md">이메일</span>
          <p className="body--sm mypage-readonly">{overview.email}</p>
          <p className="caption--md color-gray">로그인 아이디입니다.</p>
        </div>

        <div className="mypage-field">
          <span className="label--md">가입일</span>
          <p className="body--sm mypage-readonly">{formatDate(overview.createdAt)}</p>
        </div>

        <button type="submit" className="button button--primary button--md" disabled={isSaving}>
          {isSaving ? "저장 중..." : "저장"}
        </button>
      </form>
    </section>
  );
}
