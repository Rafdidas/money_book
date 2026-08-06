import { expect, test } from "@playwright/test";

const CONTACT_EMAIL = "yhu930421@naver.com";

test.describe("공개 법적 문서", () => {
  test("개인정보 처리방침을 로그인 없이 표시한다", async ({ page }) => {
    const response = await page.goto("/legal/privacy");

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "개인정보 처리방침" })).toBeVisible();
    await expect(page.getByText("시행일: 2026-08-04")).toBeVisible();
  });

  test("처리방침이 법정 필수 고지 항목을 담는다", async ({ page }) => {
    await page.goto("/legal/privacy");

    // 국외 이전 고지는 제28조의8 제1항 제3호로 별도 동의를 갈음하는 근거이므로 반드시 있어야 한다.
    await expect(page.getByRole("heading", { level: 2, name: /국외 이전/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /위탁/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /제3자 제공/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /파기 절차/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /자동 수집 장치/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /개인정보 보호책임자/ })).toBeVisible();

    // 연락처 없는 보호책임자 고지는 실효성이 없다.
    await expect(page.getByRole("link", { name: CONTACT_EMAIL }).first()).toBeVisible();
    await expect(page.getByText("박현규").first()).toBeVisible();
  });

  test("이용약관을 로그인 없이 표시한다", async ({ page }) => {
    const response = await page.goto("/legal/terms");

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "이용약관" })).toBeVisible();
    await expect(page.getByText("시행일: 2026-08-04")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /투자정보에 관한 고지/ })).toBeVisible();
  });

  test("약관이 투자정보 면책과 책임 제한을 담는다", async ({ page }) => {
    await page.goto("/legal/terms");

    await expect(page.getByText(/매수·매도 권유나 투자자문에 해당하지 않습니다/)).toBeVisible();
    await expect(page.getByText(/투자 판단과 그 결과에 대한 책임은 전적으로 이용자 본인/)).toBeVisible();
    // 고의·중과실까지 면책하는 조항은 무효이므로 예외를 명시해야 한다.
    await expect(page.getByText(/고의 또는 중대한 과실로 발생한 손해/)).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /준거법과 관할/ })).toBeVisible();
  });

  test("두 문서가 서로 이동할 수 있다", async ({ page }) => {
    await page.goto("/legal/terms");
    await page.getByRole("link", { name: "개인정보 처리방침 보기" }).click();

    await expect(page).toHaveURL(/\/legal\/privacy$/);
    await expect(page.getByRole("heading", { level: 1, name: "개인정보 처리방침" })).toBeVisible();
  });

  test("인트로 화면 하단에서 두 문서로 이동할 수 있다", async ({ page }) => {
    await page.goto("/intro");

    const legalNav = page.getByRole("navigation", { name: "약관 및 정책" });
    await expect(legalNav.getByRole("link", { name: "이용약관" })).toBeVisible();
    await legalNav.getByRole("link", { name: "개인정보 처리방침" }).click();

    await expect(page).toHaveURL(/\/legal\/privacy$/);
  });
});
