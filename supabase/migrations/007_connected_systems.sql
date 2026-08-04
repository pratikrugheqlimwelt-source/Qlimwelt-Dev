-- Connected Systems: enterprise connectors, sync logs, interest, API keys

create table if not exists public.system_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  connector_id text not null,
  connector_name text not null,
  connector_type text not null,
  authentication_type text not null default 'api_key',
  encrypted_credentials text,
  connection_name text not null,
  status text not null default 'connected'
    check (status in ('connected', 'disconnected', 'pending', 'failed')),
  health text not null default 'healthy'
    check (health in ('healthy', 'warning', 'disconnected', 'failed')),
  region text,
  endpoint text,
  description text,
  owner_user_id uuid references auth.users(id) on delete set null,
  last_sync timestamptz,
  next_sync timestamptz,
  sync_schedule text not null default 'daily'
    check (sync_schedule in ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
  last_diagnostic text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_system_connections_company on public.system_connections(company_id);
create index if not exists idx_system_connections_connector on public.system_connections(connector_id);

create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.system_connections(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  imported_records integer not null default 0,
  failed_records integer not null default 0,
  duration_ms integer not null default 0,
  status text not null default 'success'
    check (status in ('success', 'warning', 'failed')),
  log text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_sync_logs_company on public.sync_logs(company_id);
create index if not exists idx_sync_logs_connection on public.sync_logs(connection_id);

create table if not exists public.connector_interest (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  connector_id text not null,
  note text,
  created_at timestamptz not null default now(),
  unique (company_id, connector_id)
);

create index if not exists idx_connector_interest_company on public.connector_interest(company_id);

create table if not exists public.company_api_keys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default 'Default key',
  key_prefix text not null,
  key_hash text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists idx_company_api_keys_company on public.company_api_keys(company_id);

alter table public.system_connections enable row level security;
alter table public.sync_logs enable row level security;
alter table public.connector_interest enable row level security;
alter table public.company_api_keys enable row level security;

drop policy if exists system_connections_select on public.system_connections;
create policy system_connections_select on public.system_connections
  for select using (public.is_company_member(company_id));

drop policy if exists system_connections_insert on public.system_connections;
create policy system_connections_insert on public.system_connections
  for insert with check (public.is_company_member(company_id));

drop policy if exists system_connections_update on public.system_connections;
create policy system_connections_update on public.system_connections
  for update using (public.is_company_member(company_id));

drop policy if exists system_connections_delete on public.system_connections;
create policy system_connections_delete on public.system_connections
  for delete using (public.is_company_admin(company_id));

drop policy if exists sync_logs_select on public.sync_logs;
create policy sync_logs_select on public.sync_logs
  for select using (public.is_company_member(company_id));

drop policy if exists sync_logs_insert on public.sync_logs;
create policy sync_logs_insert on public.sync_logs
  for insert with check (public.is_company_member(company_id));

drop policy if exists connector_interest_select on public.connector_interest;
create policy connector_interest_select on public.connector_interest
  for select using (public.is_company_member(company_id));

drop policy if exists connector_interest_insert on public.connector_interest;
create policy connector_interest_insert on public.connector_interest
  for insert with check (public.is_company_member(company_id));

drop policy if exists company_api_keys_select on public.company_api_keys;
create policy company_api_keys_select on public.company_api_keys
  for select using (public.is_company_member(company_id));

drop policy if exists company_api_keys_insert on public.company_api_keys;
create policy company_api_keys_insert on public.company_api_keys
  for insert with check (public.is_company_member(company_id));

drop policy if exists company_api_keys_update on public.company_api_keys;
create policy company_api_keys_update on public.company_api_keys
  for update using (public.is_company_admin(company_id));
