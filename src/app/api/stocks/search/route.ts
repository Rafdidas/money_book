import { searchKisStocks } from "@/lib/kis/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  try {
    return Response.json({
      items: await searchKisStocks(query),
    });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : "종목 검색에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
