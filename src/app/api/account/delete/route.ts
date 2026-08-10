import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // 삭제 대상은 반드시 서버가 세션에서 확인한 사용자여야 한다.
  // 본문으로 id를 받으면 남의 계정을 지울 수 있으므로 본문을 아예 읽지 않는다.
  if (error || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const service = createServiceClient();
  const { error: deleteError } = await service.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return NextResponse.json({ error: "계정을 삭제하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
