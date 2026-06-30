-- 거래 유형에 메뉴(주류·담배) 판매 추가
alter type charge_type add value if not exists 'item';

-- 메뉴(주류·담배) 마스터: 판매가/도매가, 추가 가능
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sale_price int not null,   -- 판매가(원)
  cost_price int not null,   -- 도매가(원)
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table menu_items enable row level security;
create policy menu_read on menu_items for select using (auth.uid() is not null);
create policy menu_owner_write on menu_items for all
  using (current_app_role() = 'owner') with check (current_app_role() = 'owner');

insert into menu_items (name, sale_price, cost_price, sort) values
  ('양주(보틀)', 300000, 120000, 1),
  ('프리미엄 양주', 500000, 200000, 2),
  ('맥주', 30000, 10000, 3),
  ('담배', 20000, 8000, 4);

-- 거래(charges)에 메뉴 판매 정보
alter table charges add column if not exists menu_item_id uuid references menu_items(id);
alter table charges add column if not exists qty int;
alter table charges add column if not exists cost int;  -- 도매원가 합계(도매가×수량)
