# 비밀번호 재설정 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이메일 링크 기반 비밀번호 재설정 흐름을 추가하고, 회원가입과 공유하는 비밀번호 규칙 검증을 도입한다.

**Architecture:** 순수 함수인 비밀번호 규칙 모듈을 먼저 만들고(Task 1), 그 위에 재설정 요청 화면(Task 2)과 재설정 완료 화면(Task 3)을 올린다. 마지막으로 기존 회원가입·로그인 화면을 같은 규칙과 새 링크에 연결한다(Task 4, 5). 모든 화면은 기존 `auth-card-shell` 레이아웃과 `auth.scss` 클래스를 재사용한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Sass, Supabase Auth (`@supabase/ssr` 브라우저 클라이언트), Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-08-06-password-reset-design.md`

## Global Constraints

- 사용자에게 보이는 문구는 모두 한국어로 작성한다.
- 비밀번호 규칙: 8자 이상, 영문 1자 이상, 숫자 1자 이상, 최대 72바이트.
- 규칙 위반 문구는 정확히 `비밀번호는 8자 이상이며 영문과 숫자를 모두 포함해야 합니다.`
- 불일치 문구는 정확히 `비밀번호가 일치하지 않습니다.` (회원가입 화면의 기존 문구와 동일)
- 새 SCSS 파일을 만들지 않는다. `src/app/auth/auth.scss`에 클래스를 추가하는 것은 허용한다.
- 화면 구조는 `auth-page > auth-shell > auth-card-shell > (aside.auth-side + section.auth-panel)`을 따른다.
- `/auth/forgot-password`에서는 가입 여부나 오류를 사용자에게 구분해 알리지 않는다. 항상 동일한 완료 화면을 보여준다.
- `/auth/reset-password`에서 `getAuthenticatedDestination()`을 호출하지 않는다.
- `src/proxy.ts`는 수정하지 않는다.
- 신규 인증 화면의 `layout.tsx`는 `robots: { index: false, follow: true }`를 설정한다.
- 커밋 메시지는 기존 규칙대로 `feat:` / `fix:` / `docs:` 접두사를 쓴다.

---

### Task 1: 비밀번호 규칙 모듈

회원가입과 재설정이 공유할 검증 로직. 순수 함수라 React 없이 테스트한다.

**Files:**
- Create: `src/lib/auth/password.ts`
- Test: `src/lib/auth/password.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `PASSWORD_MIN_LENGTH: number` (8)
  - `PASSWORD_MAX_BYTES: number` (72)
  - `PASSWORD_RULE_MESSAGE: string`
  - `PASSWORD_TOO_LONG_MESSAGE: string`
  - `PASSWORD_MISMATCH_MESSAGE: string`
  - `getPasswordError(password: string): string` — 유효하면 빈 문자열, 아니면 오류 문구. 기존 화면들이 `useState("")`로 오류를 다루므로 빈 문자열을 "문제 없음"으로 쓴다.

- [ ] **Step 1: Write the failing test**

`src/lib/auth/password.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  PASSWORD_RULE_MESSAGE,
  PASSWORD_TOO_LONG_MESSAGE,
  getPasswordError,
} from "@/lib/auth/password";

describe("getPasswordError", () => {
  it("rejects a password shorter than 8 characters", () => {
    expect(getPasswordError("abc1234")).toBe(PASSWORD_RULE_MESSAGE);
  });

  it("rejects a password without digits", () => {
    expect(getPasswordError("abcdefgh")).toBe(PASSWORD_RULE_MESSAGE);
  });

  it("rejects a password without letters", () => {
    expect(getPasswordError("12345678")).toBe(PASSWORD_RULE_MESSAGE);
  });

  it("rejects a password longer than 72 bytes", () => {
    expect(getPasswordError(`${"a".repeat(72)}1`)).toBe(PASSWORD_TOO_LONG_MESSAGE);
  });

  it("counts bytes rather than characters for the upper bound", () => {
    // 한글은 UTF-8에서 3바이트라 25자면 75바이트가 된다.
    expect(getPasswordError(`${"가".repeat(25)}a1`)).toBe(PASSWORD_TOO_LONG_MESSAGE);
  });

  it("accepts a password with letters and digits at least 8 characters long", () => {
    expect(getPasswordError("password123")).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/auth/password.test.ts
```

Expected: FAIL — `Failed to resolve import "@/lib/auth/password"`

- [ ] **Step 3: Write minimal implementation**

`src/lib/auth/password.ts`:

```ts
export const PASSWORD_MIN_LENGTH = 8;

// bcrypt 계열 해시가 72바이트를 넘는 입력을 잘라내므로 그 앞에서 막는다.
export const PASSWORD_MAX_BYTES = 72;

export const PASSWORD_RULE_MESSAGE =
  "비밀번호는 8자 이상이며 영문과 숫자를 모두 포함해야 합니다.";
export const PASSWORD_TOO_LONG_MESSAGE =
  "비밀번호가 너무 깁니다. 더 짧게 입력해주세요.";
export const PASSWORD_MISMATCH_MESSAGE = "비밀번호가 일치하지 않습니다.";

const hasLetter = /[A-Za-z]/;
const hasDigit = /[0-9]/;

export const getPasswordError = (password: string) => {
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return PASSWORD_TOO_LONG_MESSAGE;
  }

  if (
    password.length < PASSWORD_MIN_LENGTH ||
    !hasLetter.test(password) ||
    !hasDigit.test(password)
  ) {
    return PASSWORD_RULE_MESSAGE;
  }

  return "";
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/auth/password.test.ts
```

Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/password.ts src/lib/auth/password.test.ts
git commit -m "feat: add shared password rule module"
```

---

### Task 2: 비밀번호 재설정 요청 화면

`/auth/forgot-password`. 이메일을 받아 재설정 메일을 보내고, 결과와 무관하게 동일한 완료 화면을 보여준다.

**Files:**
- Modify: `src/lib/supabase/auth-url.ts` (파일 끝에 함수 추가)
- Create: `src/app/auth/forgot-password/page.tsx`
- Create: `src/app/auth/forgot-password/layout.tsx`
- Test: `src/app/auth/forgot-password/page.test.tsx`

**Interfaces:**
- Consumes: 없음 (Task 1의 모듈은 이 화면에서 쓰지 않는다)
- Produces:
  - `getResetPasswordUrl(): string` — `src/lib/supabase/auth-url.ts`에서 export. Task 3의 화면 URL을 가리킨다.

- [ ] **Step 1: Write the failing test**

`src/app/auth/forgot-password/page.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { resetPasswordForEmail } = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
}));

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/lib/supabase/auth-url", () => ({
  getResetPasswordUrl: () => "http://localhost/auth/reset-password",
}));
vi.mock("@/lib/supabase/client", () => ({
  supabase: { auth: { resetPasswordForEmail } },
}));

import ForgotPasswordPage from "./page";

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPasswordForEmail.mockResolvedValue({ error: null });
  });

  it("does not send a mail when the email field is empty", () => {
    render(<ForgotPasswordPage />);

    fireEvent.click(screen.getByRole("button", { name: "재설정 링크 받기" }));

    expect(screen.getByText("이메일을 입력해주세요.")).toBeInTheDocument();
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("sends the trimmed email with the reset password redirect", async () => {
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "  hong@example.com  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "재설정 링크 받기" }));

    await waitFor(() => {
      expect(resetPasswordForEmail).toHaveBeenCalledWith("hong@example.com", {
        redirectTo: "http://localhost/auth/reset-password",
      });
    });
  });

  it("shows the same completion screen when the request fails", async () => {
    // 가입 여부가 새어나가지 않도록 오류와 성공을 구분해 보여주지 않는다.
    resetPasswordForEmail.mockResolvedValue({ error: { message: "User not found" } });
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "nobody@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "재설정 링크 받기" }));

    expect(await screen.findByText("메일을 보냈습니다")).toBeInTheDocument();
    expect(screen.getByText(/nobody@example.com/)).toBeInTheDocument();
    expect(screen.queryByText(/User not found/)).not.toBeInTheDocument();
  });

  it("keeps the resend button disabled during the cooldown", async () => {
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "hong@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "재설정 링크 받기" }));

    expect(await screen.findByRole("button", { name: /다시 보내기/ })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/app/auth/forgot-password/page.test.tsx
```

Expected: FAIL — `Failed to resolve import "./page"`

- [ ] **Step 3: Add the redirect URL helper**

`src/lib/supabase/auth-url.ts` 끝에 추가한다. 기존 `getAuthCallbackUrl`은 그대로 둔다.

```ts
export const getResetPasswordUrl = () => {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  return new URL("/auth/reset-password", origin).toString();
};
```

- [ ] **Step 4: Write the page**

`src/app/auth/forgot-password/page.tsx`:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import safe from "@/assets/img/renewal/safe.svg";
import { getResetPasswordUrl } from "@/lib/supabase/auth-url";
import { supabase } from "@/lib/supabase/client";

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => setCooldown(cooldown - 1), 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const sendResetMail = async (targetEmail: string) => {
    try {
      setIsSubmitting(true);

      // 오류를 사용자에게 구분해 알리지 않는다. 가입 여부가 노출되면
      // 계정 열거 창구가 된다.
      await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: getResetPasswordUrl(),
      });
    } catch {
      // 네트워크 오류도 동일하게 취급한다.
    } finally {
      setSentEmail(targetEmail);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("이메일을 입력해주세요.");
      return;
    }

    setEmailError("");
    await sendResetMail(trimmedEmail);
  };

  return (
    <div className="auth-page auth-page--login">
      <main className="auth-shell" aria-labelledby="forgot-password-title">
        <div className="auth-card-shell">
          <aside className="auth-side" aria-label="머니북가계부 소개">
            <div className="auth-side__orb auth-side__orb--top" aria-hidden="true" />
            <div className="auth-side__orb auth-side__orb--bottom" aria-hidden="true" />
            <Link href="/" className="auth-side__brand" aria-label="머니북가계부 홈">
              <span className="auth-side__mark">M</span>
              <span>머니북가계부</span>
            </Link>
            <div className="auth-side__content">
              <h2>
                비밀번호를
                <br />
                잊으셨나요?
              </h2>
              <p>가입하신 이메일로 재설정 링크를 보내드려요. 기록은 그대로 남아 있어요.</p>
              <Image src={safe} width={340} height={314} alt="" priority />
            </div>
            <p className="auth-side__foot">개인 가계부 서비스</p>
          </aside>

          <section className="auth-panel">
            <div className="auth-form-wrap auth-form-wrap--login">
              {sentEmail ? (
                <>
                  <h1 id="forgot-password-title" className="auth-title">
                    메일을 보냈습니다
                  </h1>
                  <p className="auth-subtitle">
                    {sentEmail}로 재설정 링크를 보냈습니다. 도착하지 않으면 스팸함을
                    확인해주세요.
                  </p>
                  <Link href="/auth/login" className="auth-submit auth-submit--link">
                    로그인으로 돌아가기
                  </Link>
                  <button
                    type="button"
                    className="auth-demo-button"
                    disabled={cooldown > 0 || isSubmitting}
                    onClick={() => sendResetMail(sentEmail)}
                  >
                    {cooldown > 0 ? `다시 보내기 (${cooldown}초)` : "다시 보내기"}
                  </button>
                </>
              ) : (
                <>
                  <h1 id="forgot-password-title" className="auth-title">
                    비밀번호 찾기
                  </h1>
                  <p className="auth-subtitle">가입하신 이메일로 재설정 링크를 보내드립니다</p>

                  <form className="auth-form" noValidate onSubmit={handleSubmit}>
                    <div className="auth-field">
                      <label htmlFor="forgot-password-email">이메일</label>
                      <input
                        className={emailError ? "auth-input is-invalid" : "auth-input"}
                        id="forgot-password-email"
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

                    <button type="submit" className="auth-submit" disabled={isSubmitting}>
                      {isSubmitting ? "전송 중..." : "재설정 링크 받기"}
                    </button>
                    <p className="auth-bottom-link">
                      비밀번호가 기억나셨나요? <Link href="/auth/login">로그인</Link>
                    </p>
                  </form>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Add the layout**

`src/app/auth/forgot-password/layout.tsx`:

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "비밀번호 찾기",
  description: "가입하신 이메일로 비밀번호 재설정 링크를 받으세요.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
```

- [ ] **Step 6: Add the link button style**

`src/app/auth/auth.scss`의 `.auth-submit` 규칙 뒤에 추가한다. `Link`는 버튼과 달리 인라인 요소라 정렬이 어긋나므로 맞춰준다.

```scss
.auth-submit--link {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npx vitest run src/app/auth/forgot-password/page.test.tsx
```

Expected: PASS — 4 tests

- [ ] **Step 8: Commit**

```bash
git add src/app/auth/forgot-password src/lib/supabase/auth-url.ts src/app/auth/auth.scss
git commit -m "feat: add password reset request screen"
```

---

### Task 3: 비밀번호 재설정 완료 화면

`/auth/reset-password`. 메일 링크로 진입해 세션을 확인하고 새 비밀번호를 설정한다.

**세션 수립이 이 태스크의 핵심 난점이다.** `createBrowserClient`는 PKCE 플로우와 `detectSessionInUrl`이 기본 활성이라, 링크가 세 가지 형태로 도착할 수 있다.

1. `#access_token=...` 해시 — `consumeAuthHashSession()`으로 처리
2. `?code=...` 쿼리 — `exchangeCodeForSession(code)`로 처리
3. 위 둘 중 하나가 **SDK에 의해 이미 자동 소비된 상태** — 위 두 호출이 모두 실패하지만 세션은 이미 존재

그래서 각 호출의 성공 여부로 판단하지 않고, **마지막에 `getSession()`으로 세션 존재 여부를 확인해 결정한다.**

**Files:**
- Create: `src/app/auth/reset-password/page.tsx`
- Create: `src/app/auth/reset-password/layout.tsx`
- Test: `src/app/auth/reset-password/page.test.tsx`

**Interfaces:**
- Consumes: `getPasswordError`, `PASSWORD_MISMATCH_MESSAGE` (Task 1)
- Produces: 없음

- [ ] **Step 1: Write the failing test**

`src/app/auth/reset-password/page.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { replace, getSession, updateUser, signOut, exchangeCodeForSession, consumeAuthHashSession } =
  vi.hoisted(() => ({
    replace: vi.fn(),
    getSession: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
    exchangeCodeForSession: vi.fn(),
    consumeAuthHashSession: vi.fn(),
  }));

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("@/lib/supabase/auth-url", () => ({ consumeAuthHashSession }));
vi.mock("@/lib/supabase/client", () => ({
  supabase: { auth: { getSession, updateUser, signOut, exchangeCodeForSession } },
}));

import ResetPasswordPage from "./page";

const withSession = () => {
  getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } } });
};

const withoutSession = () => {
  getSession.mockResolvedValue({ data: { session: null } });
};

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeAuthHashSession.mockResolvedValue(false);
    updateUser.mockResolvedValue({ error: null });
    signOut.mockResolvedValue({ error: null });
  });

  it("shows the expired notice with a retry link when no session exists", async () => {
    withoutSession();
    render(<ResetPasswordPage />);

    expect(await screen.findByText("링크가 만료되었어요")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "다시 요청하기" })).toHaveAttribute(
      "href",
      "/auth/forgot-password",
    );
  });

  it("shows the expired notice when consuming the hash throws", async () => {
    // 이미 사용된 링크는 setSession이 예외를 던진다.
    consumeAuthHashSession.mockRejectedValue(new Error("invalid token"));
    withoutSession();
    render(<ResetPasswordPage />);

    expect(await screen.findByText("링크가 만료되었어요")).toBeInTheDocument();
  });

  it("shows the form when the SDK already consumed the link", async () => {
    // detectSessionInUrl이 먼저 처리하면 해시 소비는 false를 반환하지만
    // 세션은 이미 존재한다. 이 경우를 만료로 오판하면 안 된다.
    withSession();
    render(<ResetPasswordPage />);

    expect(await screen.findByLabelText("새 비밀번호")).toBeInTheDocument();
  });

  it("rejects a password that breaks the rule", async () => {
    withSession();
    render(<ResetPasswordPage />);

    fireEvent.change(await screen.findByLabelText("새 비밀번호"), {
      target: { value: "abcdefgh" },
    });
    fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), {
      target: { value: "abcdefgh" },
    });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    expect(
      screen.getByText("비밀번호는 8자 이상이며 영문과 숫자를 모두 포함해야 합니다."),
    ).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords", async () => {
    withSession();
    render(<ResetPasswordPage />);

    fireEvent.change(await screen.findByLabelText("새 비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), {
      target: { value: "password124" },
    });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    expect(screen.getByText("비밀번호가 일치하지 않습니다.")).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("updates the password and revokes other sessions", async () => {
    withSession();
    render(<ResetPasswordPage />);

    fireEvent.change(await screen.findByLabelText("새 비밀번호"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith({ password: "password123" });
    });
    // 유출을 의심해 재설정하는 경우 다른 기기 세션이 남으면 의미가 없다.
    expect(signOut).toHaveBeenCalledWith({ scope: "others" });
    expect(await screen.findByText("비밀번호가 변경되었습니다")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/app/auth/reset-password/page.test.tsx
```

Expected: FAIL — `Failed to resolve import "./page"`

- [ ] **Step 3: Write the page**

`src/app/auth/reset-password/page.tsx`:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

import safe from "@/assets/img/renewal/safe.svg";
import {
  PASSWORD_MISMATCH_MESSAGE,
  getPasswordError,
} from "@/lib/auth/password";
import { consumeAuthHashSession } from "@/lib/supabase/auth-url";
import { supabase } from "@/lib/supabase/client";

type RecoveryStatus = "verifying" | "ready" | "expired" | "done";

function ResetPasswordShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page auth-page--login">
      <main className="auth-shell" aria-labelledby="reset-password-title">
        <div className="auth-card-shell">
          <aside className="auth-side" aria-label="머니북가계부 소개">
            <div className="auth-side__orb auth-side__orb--top" aria-hidden="true" />
            <div className="auth-side__orb auth-side__orb--bottom" aria-hidden="true" />
            <Link href="/" className="auth-side__brand" aria-label="머니북가계부 홈">
              <span className="auth-side__mark">M</span>
              <span>머니북가계부</span>
            </Link>
            <div className="auth-side__content">
              <h2>
                새 비밀번호를
                <br />
                설정해요
              </h2>
              <p>변경하면 다른 기기에 남아 있던 로그인은 모두 해제됩니다.</p>
              <Image src={safe} width={340} height={314} alt="" priority />
            </div>
            <p className="auth-side__foot">개인 가계부 서비스</p>
          </aside>

          <section className="auth-panel">
            <div className="auth-form-wrap auth-form-wrap--login">{children}</div>
          </section>
        </div>
      </main>
    </div>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<RecoveryStatus>("verifying");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    // 링크는 해시(#access_token)로도, 쿼리(?code)로도 도착할 수 있고,
    // detectSessionInUrl이 켜져 있어 SDK가 이미 소비했을 수도 있다.
    // 그래서 각 호출의 성공 여부가 아니라 최종 세션 존재 여부로 판단한다.
    const establishSession = async () => {
      const code = searchParams.get("code");

      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch {
          // 이미 소비된 코드일 수 있다. 아래 getSession으로 판단한다.
        }
      } else {
        try {
          await consumeAuthHashSession();
        } catch {
          // 만료되었거나 이미 사용된 링크. 아래 getSession으로 판단한다.
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isCancelled) {
        return;
      }

      setStatus(session ? "ready" : "expired");
    };

    establishSession();

    return () => {
      isCancelled = true;
    };
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const ruleError = getPasswordError(password);

    if (ruleError) {
      setPasswordError(ruleError);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError(PASSWORD_MISMATCH_MESSAGE);
      return;
    }

    try {
      setPasswordError("");
      setIsSubmitting(true);

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setPasswordError("비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      // 유출을 의심해 재설정하는 경우 다른 기기 세션이 살아 있으면 의미가 없다.
      await supabase.auth.signOut({ scope: "others" });

      setPassword("");
      setConfirmPassword("");
      setStatus("done");
    } catch {
      setPasswordError("비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "verifying") {
    return (
      <ResetPasswordShell>
        <h1 id="reset-password-title" className="auth-title">
          확인 중
        </h1>
        <p className="auth-subtitle">잠시만 기다려주세요.</p>
        <div className="auth-spinner" aria-label="링크 확인 중" />
      </ResetPasswordShell>
    );
  }

  if (status === "expired") {
    return (
      <ResetPasswordShell>
        <h1 id="reset-password-title" className="auth-title">
          링크가 만료되었어요
        </h1>
        <p className="auth-subtitle">
          재설정 링크는 발급 후 일정 시간이 지나면 사용할 수 없습니다. 다시 요청해주세요.
        </p>
        <Link href="/auth/forgot-password" className="auth-submit auth-submit--link">
          다시 요청하기
        </Link>
        <p className="auth-bottom-link">
          비밀번호가 기억나셨나요? <Link href="/auth/login">로그인</Link>
        </p>
      </ResetPasswordShell>
    );
  }

  if (status === "done") {
    return (
      <ResetPasswordShell>
        <h1 id="reset-password-title" className="auth-title">
          비밀번호가 변경되었습니다
        </h1>
        <p className="auth-subtitle">
          다른 기기에 남아 있던 로그인은 모두 해제했습니다.
        </p>
        <button
          type="button"
          className="auth-submit"
          onClick={() => {
            router.replace("/app");
          }}
        >
          머니북 시작하기
        </button>
      </ResetPasswordShell>
    );
  }

  return (
    <ResetPasswordShell>
      <h1 id="reset-password-title" className="auth-title">
        새 비밀번호 설정
      </h1>
      <p className="auth-subtitle">앞으로 사용할 비밀번호를 입력해주세요</p>

      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="reset-password-new">새 비밀번호</label>
          <input
            className={passwordError ? "auth-input is-invalid" : "auth-input"}
            id="reset-password-new"
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

        <div className="auth-field">
          <label htmlFor="reset-password-confirm">새 비밀번호 확인</label>
          <input
            className={passwordError ? "auth-input is-invalid" : "auth-input"}
            id="reset-password-confirm"
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

        <button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </ResetPasswordShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <ResetPasswordShell>
          <h1 className="auth-title">확인 중</h1>
          <p className="auth-subtitle">잠시만 기다려주세요.</p>
          <div className="auth-spinner" aria-label="링크 확인 중" />
        </ResetPasswordShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
```

- [ ] **Step 4: Add the layout**

`src/app/auth/reset-password/layout.tsx`:

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "비밀번호 재설정",
  description: "새 비밀번호를 설정하고 머니북을 계속 사용하세요.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/app/auth/reset-password/page.test.tsx
```

Expected: PASS — 6 tests

- [ ] **Step 6: Commit**

```bash
git add src/app/auth/reset-password
git commit -m "feat: add password reset completion screen"
```

---

### Task 4: 회원가입 화면에 규칙 검증 연결

현재 회원가입은 규칙 검증이 없어 Supabase의 영문 오류가 `alert`로 노출된다. 공용 모듈에 연결하고 빈 값 `alert`도 인라인 문구로 바꾼다.

**Files:**
- Modify: `src/app/auth/signup/page.tsx:40-100` (상태 추가 및 `handleSignup` 검증부)
- Modify: `src/app/auth/signup/page.tsx:175-200` (이름·이메일 필드에 오류 표시)
- Test: `src/app/auth/signup/page.test.tsx` (기존 파일에 케이스 추가)

**Interfaces:**
- Consumes: `getPasswordError`, `PASSWORD_MISMATCH_MESSAGE` (Task 1)
- Produces: 없음

기존 테스트 5건은 `password123`을 쓰고 있어 새 규칙을 통과한다. 수정 없이 계속 통과해야 한다.

- [ ] **Step 1: Write the failing test**

`src/app/auth/signup/page.test.tsx`의 `describe` 블록 안, 마지막 `it` 뒤에 추가한다.

```tsx
  it("blocks signup and shows the Korean rule message for a weak password", () => {
    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "홍길동" } });
    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "hong@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "abcdefgh" } });
    fireEvent.change(screen.getByLabelText("비밀번호 확인"), { target: { value: "abcdefgh" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "전체 동의" }));
    fireEvent.click(screen.getByRole("button", { name: "회원가입" }));

    expect(
      screen.getByText("비밀번호는 8자 이상이며 영문과 숫자를 모두 포함해야 합니다."),
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("shows inline errors instead of an alert when required fields are empty", () => {
    render(<SignupPage />);

    fireEvent.click(screen.getByRole("button", { name: "회원가입" }));

    expect(screen.getByText("이름을 입력해주세요.")).toBeInTheDocument();
    expect(screen.getByText("이메일을 입력해주세요.")).toBeInTheDocument();
    expect(screen.getByText("비밀번호를 입력해주세요.")).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/app/auth/signup/page.test.tsx
```

Expected: FAIL — 새 케이스 2건이 문구를 찾지 못한다. 기존 5건은 PASS.

- [ ] **Step 3: Add the imports and state**

`src/app/auth/signup/page.tsx`의 import 블록에 추가한다.

```tsx
import { PASSWORD_MISMATCH_MESSAGE, getPasswordError } from "@/lib/auth/password";
```

`const [passwordError, setPasswordError] = useState("");` 바로 위에 추가한다.

```tsx
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
```

- [ ] **Step 4: Replace the validation block**

`handleSignup` 안의 기존 검증부를 교체한다. 아래 코드를 지운다.

```tsx
    if (!name || !email || !password || !confirmPassword) {
      alert("이름, 이메일, 비밀번호를 모두 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("비밀번호가 일치하지 않습니다.");
      return;
    }
```

이것으로 바꾼다.

```tsx
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const nextNameError = trimmedName ? "" : "이름을 입력해주세요.";
    const nextEmailError = trimmedEmail ? "" : "이메일을 입력해주세요.";
    let nextPasswordError = "";

    if (!password || !confirmPassword) {
      nextPasswordError = "비밀번호를 입력해주세요.";
    } else if (getPasswordError(password)) {
      nextPasswordError = getPasswordError(password);
    } else if (password !== confirmPassword) {
      nextPasswordError = PASSWORD_MISMATCH_MESSAGE;
    }

    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextNameError || nextEmailError || nextPasswordError) {
      return;
    }
```

이어지는 `signUp` 호출의 `email`, `data.name`을 `trimmedEmail`, `trimmedName`으로 바꾼다.

```tsx
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
```

`try` 블록 앞부분의 `setPasswordError("");`는 그대로 두고, 그 옆에 `setNameError("");`와 `setEmailError("");`를 추가한다.

- [ ] **Step 5: Show the new errors in the markup**

이름 필드의 `<input>` 뒤(같은 `div.auth-field--signup` 안)에 추가한다.

```tsx
                  {nameError ? <p className="auth-error-text">{nameError}</p> : null}
```

이름 `<input>`에 `aria-invalid={Boolean(nameError)}`를 추가하고, `className`을 다음으로 바꾼다.

```tsx
                    className={nameError ? "auth-input auth-input--signup is-invalid" : "auth-input auth-input--signup"}
```

이메일 필드에도 같은 방식으로 적용한다.

```tsx
                    className={emailError ? "auth-input auth-input--signup is-invalid" : "auth-input auth-input--signup"}
```

```tsx
                  {emailError ? <p className="auth-error-text">{emailError}</p> : null}
```

이메일 `<input>`에 `aria-invalid={Boolean(emailError)}`를 추가한다.

두 필드의 `onChange`에서 각각 오류를 지운다.

```tsx
                    onChange={(event) => {
                      setName(event.target.value);
                      if (nameError) {
                        setNameError("");
                      }
                    }}
```

```tsx
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (emailError) {
                        setEmailError("");
                      }
                    }}
```

비밀번호 `<input>`에도 `aria-invalid={Boolean(passwordError)}`를 추가하고 `className`을 오류 반응형으로 바꾼다. 확인 필드는 이미 그렇게 되어 있다.

```tsx
                    className={passwordError ? "auth-input auth-input--signup is-invalid" : "auth-input auth-input--signup"}
```

비밀번호 필드의 `placeholder`를 규칙에 맞게 바꾼다.

```tsx
                    placeholder="영문과 숫자를 포함해 8자 이상"
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run src/app/auth/signup/page.test.tsx
```

Expected: PASS — 7 tests (기존 5 + 신규 2)

- [ ] **Step 7: Commit**

```bash
git add src/app/auth/signup
git commit -m "feat: validate signup password against shared rule"
```

---

### Task 5: 로그인 화면 연결 및 최종 검증

주석으로 비어 있던 "비밀번호 찾기" 자리를 링크로 채우고, 아이디 안내를 추가한다.

**Files:**
- Modify: `src/app/auth/login/page.tsx:193` (주석 교체)
- Modify: `src/app/auth/login/page.tsx:141-161` (이메일 필드에 안내 추가)
- Modify: `src/app/auth/auth.scss` (안내 문구 스타일 추가)
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: `/auth/forgot-password` 라우트 (Task 2)
- Produces: 없음

- [ ] **Step 1: Replace the commented placeholder**

`src/app/auth/login/page.tsx`의 아래 줄을 찾는다.

```tsx
                  {/* <span className="auth-muted-action">비밀번호 찾기</span> */}
```

교체한다.

```tsx
                  <Link href="/auth/forgot-password" className="auth-muted-action">
                    비밀번호 찾기
                  </Link>
```

`Link`는 이미 import되어 있다.

- [ ] **Step 2: Add the ID guidance**

이메일 필드의 `{emailError ? ... : null}` 줄 **앞에** 추가한다.

```tsx
                  <p className="auth-field__hint">가입하신 이메일이 아이디입니다.</p>
```

- [ ] **Step 3: Add the hint style**

`src/app/auth/auth.scss`의 `.auth-error-text, .error-text` 규칙 뒤에 추가한다.

```scss
.auth-field__hint {
  margin: -8px 0 12px;
  color: var(--auth-muted);
  font-size: 13px;
  line-height: 1.4;
}
```

`--auth-muted`는 `.auth-subtitle`과 `.auth-bottom-link`가 쓰는 기존 토큰이다. 여백은 `.auth-error-text`와 같은 값을 써서 오류 문구가 나타날 때 자리가 흔들리지 않게 한다.

- [ ] **Step 4: Verify the link renders**

```bash
npx vitest run src/app/auth
```

Expected: PASS — forgot-password 4, reset-password 6, signup 7, consent 기존 케이스

- [ ] **Step 5: Run the full verification suite**

```bash
npm run lint
```

Expected: 오류 없이 종료

```bash
npm run test
```

Expected: 기존 12건 + 신규 케이스 모두 PASS

```bash
npm run build
```

Expected: 빌드 성공, `/auth/forgot-password`와 `/auth/reset-password`가 라우트 목록에 나타남

- [ ] **Step 6: Check both widths in the browser**

`npm run dev`로 띄운 뒤 데스크톱(1280px)과 모바일(375px)에서 두 화면을 확인한다.

- `/auth/forgot-password` — 폼 상태와 완료 상태(제출 후) 모두
- `/auth/reset-password` — 링크 없이 직접 접근해 만료 화면 확인

- [ ] **Step 7: Update HANDOFF.md**

파일 맨 위에 항목을 추가한다.

```markdown
# 2026-08-06 비밀번호 재설정

- `/auth/forgot-password`, `/auth/reset-password` 두 화면을 추가하고 로그인 화면에서 연결했습니다.
- `src/lib/auth/password.ts`로 비밀번호 규칙(8자 이상, 영문·숫자 포함, 72바이트 이하)을 분리해 회원가입과 재설정이 공유합니다.
- 회원가입 화면의 `alert` 검증을 인라인 오류로 교체했습니다.
- 비밀번호 변경 후 `signOut({ scope: "others" })`로 다른 기기 세션을 끊습니다.
- 아이디 찾기는 만들지 않았습니다. 근거는 `docs/superpowers/specs/2026-08-06-password-reset-design.md`에 기록했습니다.
- 프로덕션 DB/데이터 변경: 없음.
- 남은 작업: Supabase 대시보드의 Auth 비밀번호 정책을 최소 8자, 영문+숫자 필수로 맞춰야 화면과 서버 규칙이 일치합니다.
- 검증:
  - `npm run lint`: 통과
  - `npm run test`: 통과
  - `npm run build`: 통과
  - 데스크톱 1280px, 모바일 375px 확인 완료
```

- [ ] **Step 8: Commit**

```bash
git add src/app/auth/login/page.tsx src/app/auth/auth.scss HANDOFF.md
git commit -m "feat: link password reset from the login screen"
```

---

## 구현 후 수동 작업

코드로 처리할 수 없는 항목이다. 완료 보고 시 사용자에게 안내한다.

**Supabase 대시보드 — Authentication > Policies**

- Minimum password length: `8`
- Required characters: 영문 + 숫자

화면 검증만 있고 서버 정책이 느슨하면 API를 직접 호출하는 경로로 약한 비밀번호가 들어갈 수 있다. 반대로 서버 정책이 더 엄격하면 화면을 통과한 값이 영문 오류로 거부된다.

**Supabase 대시보드 — Authentication > URL Configuration**

- Redirect URLs에 `/auth/reset-password`가 허용 목록에 포함되어야 한다. 와일드카드로 `/auth/**`가 이미 등록되어 있으면 추가 작업이 필요 없다.

**메일 템플릿 (선택)**

Reset Password 템플릿이 영문 기본값이면 한국어로 바꾼다. 이번 범위에 포함하지 않았으므로 필요 시 별도로 진행한다.
