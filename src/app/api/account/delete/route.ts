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

  // 마이그레이션(ON DELETE CASCADE)이 아직 적용되지 않았을 수 있으므로,
  // 사용자가 이미 삭제된 뒤에도 남을 수 있는 expenses 행을 서비스 롤로 직접 정리한다.
  // 마이그레이션이 적용된 이후에는 0건 삭제로 끝나는 안전한 중복 작업이 된다.
  const { error: expensesError } = await service.from("expenses").delete().eq("user_id", user.id);

  if (expensesError) {
    // 계정 자체는 이미 삭제되었으므로 요청을 실패로 처리하지 않고, 정리 실패만 best-effort로 보고한다.
    return NextResponse.json({ ok: true, warning: "일부 데이터를 정리하지 못했습니다." });
  }

  return NextResponse.json({ ok: true });
}
