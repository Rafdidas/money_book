import { searchKisStocks } from "@/lib/kis/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length > 80) {
    return Response.json(
      { message: "검색어는 80자 이하로 입력해주세요." },
      { status: 400 },
    );
  }

  try {
    return Response.json({
      items: await searchKisStocks(query),
    });
  } catch (error) {
    console.error("stock-search-failed", error);
    return Response.json(
      { message: "잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
