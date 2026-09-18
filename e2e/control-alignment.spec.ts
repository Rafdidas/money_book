import { expect, test, type Page } from "@playwright/test";

async function openDemoDashboard(page: Page) {
  await page.goto("/auth/login");
  await page.getByRole("button", { name: "데모 체험하기" }).click();
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
}

test("대시보드 입력 컨트롤 높이가 40px 스케일을 따른다", async ({ page }) => {
  await openDemoDashboard(page);

  const control = page.locator(".main-overview--control").first();
  await expect(control).toBeVisible();

  const height = await control.evaluate((element) =>
    Math.round(element.getBoundingClientRect().height),
  );
  expect(height).toBe(40);
});
