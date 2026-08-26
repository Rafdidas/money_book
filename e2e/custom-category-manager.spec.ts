import { expect, test } from "@playwright/test";

test("데모에서 카테고리를 추가하고 즐겨찾기로 지정한다", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByRole("button", { name: "데모 체험하기" }).click();

  const form = page.locator(".main-overview--form-card");
  await form.getByRole("button", { name: "카테고리 관리" }).click();

  const dialog = page.getByRole("dialog", { name: "내 카테고리 관리" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("새 카테고리 이름").fill("반려동물 병원");
  await dialog.getByRole("button", { name: "카테고리 추가" }).click();
  await dialog.getByRole("button", { name: "반려동물 병원 자주 쓰기 지정" }).click();

  await expect(dialog.getByRole("button", { name: "반려동물 병원 자주 쓰기 해제" })).toBeVisible();
});
