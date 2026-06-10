-- ── vein_queries: wallet query tracking ─────────────────────────
create table if not exists vein_queries (
  wallet          text primary key,
  count           integer not null default 0,
  last_query      timestamptz,
  last_payment_tx text,
  created_at      timestamptz default now()
);

create index if not exists vein_queries_wallet_idx on vein_queries(wallet);
alter table vein_queries enable row level security;

create policy "Service role full access"
  on vein_queries for all using (true) with check (true);

-- ── vein_reports: auto-generated weekly reports ──────────────────
create table if not exists vein_reports (
  id              bigserial primary key,
  week_number     integer not null,
  week_label      text not null,
  period_start    timestamptz not null,
  period_end      timestamptz not null,
  data            jsonb not null,
  generated_at    timestamptz default now()
);

create index if not exists vein_reports_week_idx on vein_reports(week_number desc);
alter table vein_reports enable row level security;

create policy "Public read"
  on vein_reports for select using (true);

create policy "Service role write"
  on vein_reports for all using (true) with check (true);

-- ── vein_config: tracks launch date and cron state ───────────────
create table if not exists vein_config (
  key   text primary key,
  value text not null
);

alter table vein_config enable row level security;

create policy "Service role full access"
  on vein_config for all using (true) with check (true);

-- Set launch date (update this to your actual deploy date)
insert into vein_config (key, value)
values ('launch_date', now()::text)
on conflict (key) do nothing;

-- ── views ────────────────────────────────────────────────────────
create or replace view vein_usage_summary as
  select
    count(*) as total_wallets,
    sum(count) as total_queries,
    max(last_query) as last_active,
    count(*) filter (where count >= 5) as paid_wallets
  from vein_queries;