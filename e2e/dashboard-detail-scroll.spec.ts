import { expect, test } from "@playwright/test";

test("상세내용의 마지막 내역까지 페이지 스크롤로 볼 수 있다", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByRole("button", { name: "데모 체험하기" }).click();
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();

  const detailTable = page.locator(".main-detail .table--wrap");
  await expect(detailTable.locator("tbody tr").last()).toBeAttached();

  await expect
    .poll(() =>
      detailTable.evaluate((element) => element.scrollHeight - element.clientHeight),
    )
    .toBeLessThanOrEqual(1);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect
    .poll(() =>
      detailTable.locator("tbody tr").last().evaluate((row) => row.getBoundingClientRect().bottom),
    )
    .toBeLessThanOrEqual(page.viewportSize()!.height);
});
