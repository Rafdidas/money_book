alter table public.investment_stocks
drop constraint if exists investment_stocks_symbol_check;

update public.investment_stocks
set symbol = upper(symbol)
where symbol <> upper(symbol);

alter table public.investment_stocks
add constraint investment_stocks_symbol_check
check (symbol ~ '^[0-9A-Z]{6}$');
