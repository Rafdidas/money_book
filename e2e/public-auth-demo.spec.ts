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

test("직접입력 저축·투자를 새로고침 후에도 구분하고 추천 삭제는 내역과 입력을 보존한다", async ({
  page,
}) => {
  await page.goto("/auth/login");
  await page.getByRole("button", { name: "데모 체험하기" }).click();

  const form = page.locator(".main-overview--form-card");
  const addCustomEntry = async (type: "저축" | "투자", category: string) => {
    await form.getByRole("button", { name: type, exact: true }).click();
    await form.getByLabel("카테고리").selectOption({ label: "직접 입력" });
    await form
      .getByRole("textbox", { name: "직접입력 카테고리", exact: true })
      .fill(category);
    await form.getByLabel("금액").fill("10000");
    await form.getByLabel("메모").fill(`${category} 메모`);
    await form.getByRole("button", { name: "내역 추가" }).click();
    await expect
      .poll(() =>
        page.evaluate((savedCategory) => {
          const entries = JSON.parse(
            localStorage.getItem("money-book:demo-expenses") ?? "[]",
          ) as Array<{ category: string }>;
          return entries.some((entry) => entry.category === savedCategory);
        }, category),
      )
      .toBe(true);
  };

  await addCustomEntry("저축", "여행 준비금");
  await addCustomEntry("투자", "미래 자산");

  await form.getByRole("button", { name: "저축", exact: true }).click();
  await form.getByLabel("카테고리").selectOption({ label: "직접 입력" });
  await form.getByRole("button", { name: "여행 준비금", exact: true }).click();
  await expect(
    form.getByRole("textbox", { name: "직접입력 카테고리", exact: true }),
  ).toHaveValue("여행 준비금");
  await form.getByRole("button", { name: "여행 준비금 최근 카테고리 삭제" }).click();
  await expect(
    form.getByRole("textbox", { name: "직접입력 카테고리", exact: true }),
  ).toHaveValue("여행 준비금");
  await expect(
    form.getByRole("button", { name: "여행 준비금 최근 카테고리 삭제" }),
  ).toHaveCount(0);

  await expect
    .poll(() =>
      page.evaluate(() => {
        const entries = JSON.parse(
          localStorage.getItem("money-book:demo-expenses") ?? "[]",
        ) as Array<{ category: string }>;
        return entries.some((entry) => entry.category === "여행 준비금");
      }),
    )
    .toBe(true);

  await page.reload();
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();

  const persistedTypes = await page.evaluate(() => {
    const entries = JSON.parse(
      localStorage.getItem("money-book:demo-expenses") ?? "[]",
    ) as Array<{ category: string; entry_type?: string }>;
    return Object.fromEntries(
      entries
        .filter((entry) => ["여행 준비금", "미래 자산"].includes(entry.category))
        .map((entry) => [entry.category, entry.entry_type]),
    );
  });
  expect(persistedTypes).toEqual({
    "여행 준비금": "savings",
    "미래 자산": "investment",
  });

  await form.getByRole("tab", { name: "수정" }).click();
  await form.getByRole("button", { name: "저축", exact: true }).click();
  await expect(form.getByLabel("이번 달 수정할 직접 입력 내역")).toContainText("여행 준비금");
  await form.getByRole("button", { name: "투자", exact: true }).click();
  await expect(form.getByLabel("이번 달 수정할 직접 입력 내역")).toContainText("미래 자산");
});
