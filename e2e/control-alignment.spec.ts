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

test("버튼과 배지 높이가 공통 스케일을 따른다", async ({ page }) => {
  await openDemoDashboard(page);

  const smallButton = page.locator(".button.button--sm").first();
  await expect(smallButton).toBeVisible();
  await expect
    .poll(() => smallButton.evaluate((el) => Math.round(el.getBoundingClientRect().height)))
    .toBe(32);

  const scale = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      sm: styles.getPropertyValue("--control-height-sm").trim(),
      md: styles.getPropertyValue("--control-height-md").trim(),
      lg: styles.getPropertyValue("--control-height-lg").trim(),
      badge: styles.getPropertyValue("--badge-height").trim(),
    };
  });
  expect(scale).toEqual({ sm: "32px", md: "40px", lg: "48px", badge: "24px" });

  const usesScale = await page.evaluate(() => {
    const sheetText = Array.from(document.styleSheets)
      .flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((rule) => rule.cssText);
        } catch {
          return [];
        }
      })
      .join("\n");
    return /--button-height:\s*var\(--control-height-md\)/.test(sheetText);
  });
  expect(usesScale).toBe(true);
});
