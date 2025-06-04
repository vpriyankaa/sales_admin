create table users (
  id bigserial primary key, -- ✅ auto-incrementing ID
  name text,
  phone bigint,
  password text,
  email text,
  created_at timestamptz default now()
);

-- supabase/schema.sql

create table if not exists customers (
  id bigserial primary key,
  created_at timestamptz default now(),
  name text not null,
  phone bigint not null,
  aadhaar varchar(12) unique,
  address varchar(255)
);


create table if not exists customerLogs (
  id bigserial primary key,
  created_at timestamptz default now(),
  action text not null,
  user bigint not null,
  customer_id bigint not null,
);


create table if not exists orders (
  id bigserial primary key,
  created_at timestamptz default now(),
  customer_id bigint not null,
  customer_name text not null,
  items json not null,
  total_price double precision not null,
  status text not null,
  payment_method text not null,
  discount_type text,
  discount_value bigint,
  remaining_amount double precision,
  paid_amount double precision,
  remarks text,
  payment_status text,
  total_payable double precision not null,
  date timestamptz not null,
  type text,
  vendor_id bigint,
  vendor_name text
);

create table if not exists orderLogs (
  id bigserial primary key,
  created_at timestamptz default now(),
  order_id bigint not null,
  action varchar not null,
  comments text
);



create table if not exists paymentLogs (
  id bigserial primary key,
  created_at timestamptz default now(),
  order_id bigint not null,
  action text not null,
  comments text,
  documents text

);

create table if not exists products (
  id bigserial primary key,
  created_at timestamptz default now(),
  name text not null,
  quantity bigint not null,
  unit text not null,
  price double precision not null
);

create table if not exists productLogs (
  id bigserial primary key,
  created_at timestamptz default now(),
  product_id bigint not null,
  action text not null,
  "user" bigint not null

);

create table if not exists units (
  id bigserial primary key,
  created_at timestamptz default now(),
  name text not null
);

create table if not exists users (
  id bigserial primary key,
  created_at timestamptz default now(),
  name text not null,
  phone bigint not null,
  password text not null,
  email text not null
);


create table if not exists vendors (
  id bigserial primary key,
  created_at timestamptz default now(),
  name text not null,
  phone bigint not null,
  products json,
  aadhaar bigint,
  address text
);


create table if not exists vendorLogs (
  id bigserial primary key,
  created_at timestamptz default now(),
  action text not null,
  "user" bigint not null,
  vendor_id bigint not null

);
