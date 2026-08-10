-- expenses는 마이그레이션 없이 대시보드에서 만들어져 user_id에 외래키가 없었다.
-- 제약이 없으면 계정을 삭제해도 가계부 기록이 주인 없이 남아, 개인정보 처리방침의
-- "지체 없이 파기"와 어긋난다. 삭제가 실패하지 않고 조용히 남기 때문에 더 위험하다.
--
-- 적용 전 운영 DB 확인(2026-08-10): user_id가 비어 있는 행 0건,
-- 존재하지 않는 사용자를 가리키는 행 0건, 전체 3,404건.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expenses_user_id_fkey'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
      add constraint expenses_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end
$$;
