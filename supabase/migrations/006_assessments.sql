-- Guided assessments (corporate CCF pipeline)
-- Run after 005_evidence_storage.sql

create table if not exists public.assessments (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  type text not null default 'corporate'
    check (type in ('corporate', 'product', 'event', 'supplier')),
  status text not null default 'draft'
    check (status in ('draft', 'in_progress', 'ready_for_review', 'calculated', 'locked')),
  current_step text not null default 'profile',
  profile jsonb not null default '{}'::jsonb,
  boundary jsonb not null default '{}'::jsonb,
  screening jsonb not null default '{}'::jsonb,
  responses jsonb not null default '[]'::jsonb,
  enabled_modules text[] not null default '{}',
  module_progress jsonb not null default '[]'::jsonb,
  assumptions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assessments_company on public.assessments(company_id);

drop trigger if exists assessments_updated_at on public.assessments;
create trigger assessments_updated_at
  before update on public.assessments
  for each row execute function public.set_updated_at();

alter table public.emission_activities
  add column if not exists assessment_id text references public.assessments(id) on delete set null;

alter table public.emission_activities
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_emission_activities_assessment
  on public.emission_activities(assessment_id);

alter table public.assessments enable row level security;

drop policy if exists assessments_select on public.assessments;
create policy assessments_select on public.assessments
  for select using (
    company_id in (
      select company_id from public.company_members where user_id = auth.uid()
    )
  );

drop policy if exists assessments_insert on public.assessments;
create policy assessments_insert on public.assessments
  for insert with check (
    company_id in (
      select company_id from public.company_members where user_id = auth.uid()
    )
  );

drop policy if exists assessments_update on public.assessments;
create policy assessments_update on public.assessments
  for update using (
    company_id in (
      select company_id from public.company_members where user_id = auth.uid()
    )
  );

drop policy if exists assessments_delete on public.assessments;
create policy assessments_delete on public.assessments
  for delete using (
    company_id in (
      select company_id from public.company_members where user_id = auth.uid()
    )
  );
