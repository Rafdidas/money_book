alter table public.user_custom_categories
  add column if not exists is_favorite boolean not null default false;

create index if not exists user_custom_categories_favorite_idx
  on public.user_custom_categories (user_id, entry_type, is_favorite desc, last_used_at desc);

create or replace function public.set_user_custom_category_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := btrim(new.name);
  new.normalized_name := lower(new.name);
  return new;
end;
$$;

create or replace function public.enforce_user_custom_category_favorite_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_favorite then
    perform pg_advisory_xact_lock(hashtextextended(new.user_id::text || ':' || new.entry_type, 0));
    if (
      select count(*)
      from public.user_custom_categories
      where user_id = new.user_id
        and entry_type = new.entry_type
        and is_favorite
        and id <> new.id
    ) >= 5 then
      raise exception using errcode = 'P0001', message = 'custom_category_favorite_limit';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_user_custom_category_favorite_limit on public.user_custom_categories;
create trigger enforce_user_custom_category_favorite_limit
before insert or update of is_favorite, entry_type, user_id on public.user_custom_categories
for each row execute function public.enforce_user_custom_category_favorite_limit();
