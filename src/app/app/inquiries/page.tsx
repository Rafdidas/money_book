"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AppIcon from "@/components/common/AppIcon";
import SideMenu from "@/components/common/SideMenu";
import { useAppAlert } from "@/components/app-alert/AppAlertProvider";
import { useAppData } from "@/app/providers";
import {
  answerInquiry,
  createInquiry,
  getCurrentProfileRole,
  getInquiries,
} from "@/lib/api/inquiries";
import type { InquiryCursor } from "@/lib/api/inquiries";
import type { Inquiry, InquiryStatus, ProfileRole } from "@/types/inquiry";
import "./inquiries.scss";

type InquiryFilter = "ALL" | InquiryStatus;

const formatDateTime = (value: string | null) => {
  if (!value) return "";

  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabel: Record<InquiryStatus, string> = {
  PENDING: "답변 전",
  ANSWERED: "답변 완료",
};

export default function InquiriesPage() {
  const { displayName, displayEmail, isDemoMode, isAuthResolved } = useAppData();
  const { alert } = useAppAlert();
  const [role, setRole] = useState<ProfileRole>("USER");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiryId, setSelectedInquiryId] = useState("");
  const [filter, setFilter] = useState<InquiryFilter>("ALL");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [answerTitle, setAnswerTitle] = useState("");
  const [answerContent, setAnswerContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<InquiryCursor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAdmin = role === "ADMIN";

  const loadInquiries = useCallback(async () => {
    if (isDemoMode) {
      setIsLoading(false);
      setHasMore(false);
      setNextCursor(null);
      return;
    }

    setIsLoading(true);

    try {
      const [nextRole, nextInquiries] = await Promise.all([
        getCurrentProfileRole(),
        getInquiries(),
      ]);
      setRole(nextRole);
      setInquiries(nextInquiries.items);
      setHasMore(nextInquiries.hasMore);
      setNextCursor(nextInquiries.nextCursor);
      setSelectedInquiryId((current) =>
        nextInquiries.items.some((item) => item.id === current)
          ? current
          : nextInquiries.items[0]?.id || "",
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "문의 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [alert, isDemoMode]);

  const loadMoreInquiries = async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;

    setIsLoadingMore(true);
    try {
      const nextPage = await getInquiries(nextCursor);
      setInquiries((current) => {
        const currentIds = new Set(current.map((inquiry) => inquiry.id));
        return [...current, ...nextPage.items.filter((inquiry) => !currentIds.has(inquiry.id))];
      });
      setHasMore(nextPage.hasMore);
      setNextCursor(nextPage.nextCursor);
    } catch (error) {
      alert(error instanceof Error ? error.message : "문의 목록을 더 불러오지 못했습니다.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!isAuthResolved) return;
    loadInquiries();
  }, [isAuthResolved, loadInquiries]);

  const filteredInquiries = useMemo(
    () =>
      filter === "ALL"
        ? inquiries
        : inquiries.filter((inquiry) => inquiry.status === filter),
    [filter, inquiries],
  );
  const selectedInquiry = useMemo(
    () => inquiries.find((inquiry) => inquiry.id === selectedInquiryId) ?? null,
    [inquiries, selectedInquiryId],
  );
  const pendingCount = inquiries.filter((inquiry) => inquiry.status === "PENDING").length;

  useEffect(() => {
    if (!selectedInquiry || !isAdmin) return;
    setAnswerTitle(selectedInquiry.answer_title || "");
    setAnswerContent(selectedInquiry.answer_content || "");
  }, [isAdmin, selectedInquiry]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (trimmedTitle.length < 2 || trimmedTitle.length > 100) {
      alert("문의 제목은 2자 이상 100자 이하로 입력해주세요.");
      return;
    }
    if (trimmedContent.length < 10 || trimmedContent.length > 5000) {
      alert("문의 내용은 10자 이상 5,000자 이하로 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const inquiry = await createInquiry({ title: trimmedTitle, content: trimmedContent });
      setInquiries((current) => [inquiry, ...current]);
      setSelectedInquiryId(inquiry.id);
      setTitle("");
      setContent("");
      alert("문의가 등록되었습니다.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "문의 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedInquiry) return;

    const trimmedTitle = answerTitle.trim();
    const trimmedContent = answerContent.trim();

    if (trimmedTitle.length < 2 || trimmedTitle.length > 100) {
      alert("답변 제목은 2자 이상 100자 이하로 입력해주세요.");
      return;
    }
    if (trimmedContent.length < 2 || trimmedContent.length > 5000) {
      alert("답변 내용은 2자 이상 5,000자 이하로 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const inquiry = await answerInquiry(selectedInquiry.id, {
        answerTitle: trimmedTitle,
        answerContent: trimmedContent,
      });
      setInquiries((current) =>
        current.map((item) => (item.id === inquiry.id ? inquiry : item)),
      );
      alert("답변이 저장되었습니다.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "답변 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthResolved) return null;

  return (
    <div className="home-page">
      <SideMenu
        displayName={displayName}
        displayEmail={displayEmail}
        isDemoMode={isDemoMode}
      />
      <main className="main inquiries-page column-group">
        <section className="main-header inquiries-header row-group row-group--center row-group--between">
          <div>
            <h2 className="main-header--title headline--sm">
              {isAdmin ? "문의 관리" : "문의하기"}
            </h2>
            <p className="inquiries-header--description label--md">
              {isAdmin
                ? "회원 문의를 확인하고 답변을 관리합니다."
                : "서비스 이용 중 불편한 점이나 요청사항을 남겨주세요."}
            </p>
          </div>
          {isAdmin ? (
            <span className="badge badge--teal">답변 대기 {pendingCount}건</span>
          ) : null}
        </section>

        {isDemoMode ? (
          <section className="card inquiries-demo">
            <AppIcon name="support_agent" />
            <h3 className="title--sm">문의하기는 로그인 후 이용할 수 있습니다.</h3>
            <p className="body--sm color-gray">
              데모 모드에서는 실제 문의를 등록하거나 답변을 확인하지 않습니다.
            </p>
          </section>
        ) : (
          <div className="inquiries-layout">
            <div className="inquiries-sidebar column-group column-group--gap-16">
              {!isAdmin ? (
                <form className="card inquiry-form column-group column-group--gap-16" onSubmit={handleCreate}>
                  <div>
                    <h3 className="title--sm">새 문의</h3>
                    <p className="caption--md color-gray">확인 후 문의 목록에서 답변을 안내합니다.</p>
                  </div>
                  <label className="main-overview--field">
                    <span className="label--md">제목</span>
                    <input
                      className="main-overview--control body--sm"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      maxLength={100}
                      placeholder="문의 제목"
                      required
                    />
                    <span className="caption--md color-gray">{title.length}/100</span>
                  </label>
                  <label className="main-overview--field">
                    <span className="label--md">내용</span>
                    <textarea
                      className="main-overview--control body--sm"
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      maxLength={5000}
                      placeholder="문의 내용을 자세히 입력해주세요."
                      required
                    />
                    <span className="caption--md color-gray">{content.length}/5,000</span>
                  </label>
                  <button className="button button--primary button--md" disabled={isSubmitting}>
                    {isSubmitting ? "등록 중" : "문의 등록"}
                  </button>
                </form>
              ) : null}

              <section className="card inquiries-list-section column-group column-group--gap-12">
                <div className="row-group row-group--center row-group--between">
                  <div>
                    <h3 className="title--sm">{isAdmin ? "전체 문의" : "나의 문의"}</h3>
                    <p className="caption--md color-gray">{inquiries.length}건</p>
                  </div>
                  {isAdmin ? (
                    <select
                      className="main-overview--control body--sm"
                      value={filter}
                      onChange={(event) => setFilter(event.target.value as InquiryFilter)}
                      aria-label="문의 상태 필터"
                    >
                      <option value="ALL">전체</option>
                      <option value="PENDING">답변 전</option>
                      <option value="ANSWERED">답변 완료</option>
                    </select>
                  ) : null}
                </div>
                <div className="inquiries-list">
                  {isLoading ? (
                    <p className="inquiries-empty body--sm color-gray">문의 목록을 불러오는 중입니다.</p>
                  ) : filteredInquiries.length ? (
                    filteredInquiries.map((inquiry) => (
                      <button
                        key={inquiry.id}
                        type="button"
                        className={`inquiry-list-item ${selectedInquiryId === inquiry.id ? "is-selected" : ""}`}
                        onClick={() => setSelectedInquiryId(inquiry.id)}
                      >
                        <div className="row-group row-group--center row-group--between">
                          <span className={`badge ${inquiry.status === "ANSWERED" ? "badge--teal" : "badge--blue"}`}>
                            {statusLabel[inquiry.status]}
                          </span>
                          <span className="caption--md color-gray">{formatDateTime(inquiry.created_at)}</span>
                        </div>
                        <strong className="label--lg">{inquiry.title}</strong>
                        {isAdmin ? (
                          <span className="caption--md color-gray">{inquiry.user_email || "이메일 없음"}</span>
                        ) : null}
                      </button>
                    ))
                  ) : (
                    <p className="inquiries-empty body--sm color-gray">
                      {isAdmin ? "조건에 맞는 문의가 없습니다." : "아직 작성한 문의가 없습니다."}
                    </p>
                  )}
                </div>
              </section>
                {hasMore ? (
                  <button
                    className="button button--secondary button--md"
                    type="button"
                    disabled={isLoadingMore}
                    onClick={loadMoreInquiries}
                  >
                    {isLoadingMore ? "불러오는 중" : "더 보기"}
                  </button>
                ) : null}
            </div>

            <section className="card inquiry-detail column-group column-group--gap-20">
              {selectedInquiry ? (
                <>
                  <header className="inquiry-detail--header column-group column-group--gap-8">
                    <div className="row-group row-group--center row-group--between">
                      <span className={`badge ${selectedInquiry.status === "ANSWERED" ? "badge--teal" : "badge--blue"}`}>
                        {statusLabel[selectedInquiry.status]}
                      </span>
                      <span className="caption--md color-gray">{formatDateTime(selectedInquiry.created_at)}</span>
                    </div>
                    <h3 className="title--md">{selectedInquiry.title}</h3>
                    {isAdmin ? (
                      <span className="caption--md color-gray">{selectedInquiry.user_email || "이메일 없음"}</span>
                    ) : null}
                  </header>
                  <div className="inquiry-detail--content body--sm">{selectedInquiry.content}</div>

                  {isAdmin ? (
                    <form className="inquiry-answer-form column-group column-group--gap-16" onSubmit={handleAnswer}>
                      <div>
                        <h4 className="title--sm">
                          {selectedInquiry.status === "ANSWERED" ? "답변 수정" : "답변 작성"}
                        </h4>
                        {selectedInquiry.answered_at ? (
                          <p className="caption--md color-gray">
                            마지막 답변 {formatDateTime(selectedInquiry.answered_at)}
                          </p>
                        ) : null}
                      </div>
                      <label className="main-overview--field">
                        <span className="label--md">답변 제목</span>
                        <input
                          className="main-overview--control body--sm"
                          value={answerTitle}
                          onChange={(event) => setAnswerTitle(event.target.value)}
                          maxLength={100}
                          required
                        />
                      </label>
                      <label className="main-overview--field">
                        <span className="label--md">답변 내용</span>
                        <textarea
                          className="main-overview--control body--sm"
                          value={answerContent}
                          onChange={(event) => setAnswerContent(event.target.value)}
                          maxLength={5000}
                          required
                        />
                      </label>
                      <button className="button button--primary button--md" disabled={isSubmitting}>
                        {isSubmitting ? "저장 중" : "답변 저장"}
                      </button>
                    </form>
                  ) : (
                    <section className="inquiry-answer column-group column-group--gap-8">
                      <h4 className="title--sm">관리자 답변</h4>
                      {selectedInquiry.status === "ANSWERED" ? (
                        <>
                          <strong className="label--lg">{selectedInquiry.answer_title}</strong>
                          <p className="body--sm">{selectedInquiry.answer_content}</p>
                          <span className="caption--md color-gray">
                            {formatDateTime(selectedInquiry.answered_at)}
                          </span>
                        </>
                      ) : (
                        <p className="body--sm color-gray">
                          아직 답변이 등록되지 않았습니다. 확인 후 답변드릴게요.
                        </p>
                      )}
                    </section>
                  )}
                </>
              ) : (
                <div className="inquiry-detail--empty">
                  <AppIcon name="forum" />
                  <p className="body--sm color-gray">문의를 선택하면 상세 내용을 확인할 수 있습니다.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
