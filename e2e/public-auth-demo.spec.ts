import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test("공개 첫 화면을 표시한다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/머니북가계부/);
  await expect(page.getByRole("link", { name: /시작하기/ }).first()).toBeVisible();
});

test("비로그인 앱 접근은 원래 경로를 보존해 로그인으로 이동한다", async ({ page }) => {
  await page.goto("/app/analysis");

  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fapp%2Fanalysis$/);
  await expect(page.getByRole("heading", { level: 1, name: "로그인" })).toBeVisible();
});

test("데모 체험은 운영 DB 로그인 없이 대시보드로 진입한다", async ({ page, context }) => {
  await page.goto("/auth/login");
  await page.getByRole("button", { name: "데모 체험하기" }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();

  const cookies = await context.cookies();
  expect(cookies).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: "money-book-demo-mode", value: "true" }),
    ]),
  );
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("money-book:demo-mode")))
    .toBe("true");
});
