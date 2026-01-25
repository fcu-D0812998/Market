-- PostgreSQL (Neon) DDL

-- 1) Tag
create table if not exists tag (
  id bigserial primary key,
  name varchar(50) not null unique
);

-- 2) Product
create table if not exists product (
  id bigserial primary key,
  name varchar(200) not null,
  price integer not null check (price >= 0),
  is_active boolean not null default true,
  image_url text not null default '',
  description text not null default ''
);

-- 3) Product <-> Tag (many-to-many)
create table if not exists product_tag (
  product_id bigint not null references product(id) on delete cascade,
  tag_id bigint not null references tag(id) on delete cascade,
  primary key (product_id, tag_id)
);

create index if not exists idx_product_tag_tag_id on product_tag(tag_id);

-- 4) Order (避免保留字，用 orders)
create table if not exists orders (
  id bigserial primary key,
  order_no varchar(32) not null unique,
  customer_name varchar(100) not null,
  customer_phone varchar(30) not null,
  pickup_store_address text not null,
  total_amount integer not null check (total_amount >= 0),
  status varchar(20) not null default 'NEW' check (status in ('NEW','CONFIRMED','CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_order_no on orders(order_no);
create index if not exists idx_orders_customer_phone on orders(customer_phone);

-- 自動更新 updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_orders_set_updated_at on orders;
create trigger trg_orders_set_updated_at
before update on orders
for each row execute function set_updated_at();

-- 5) OrderItem
create table if not exists order_item (
  id bigserial primary key,
  order_id bigint not null references orders(id) on delete cascade,
  product_id bigint references product(id) on delete set null,
  product_name_snapshot varchar(200) not null,
  unit_price_snapshot integer not null check (unit_price_snapshot >= 0),
  quantity integer not null check (quantity > 0),
  line_total integer not null check (line_total >= 0)
);

create index if not exists idx_order_item_order_id on order_item(order_id);
create index if not exists idx_order_item_product_id on order_item(product_id);