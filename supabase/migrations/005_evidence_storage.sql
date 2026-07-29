-- Evidence attachments for emission activities
create table if not exists public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  activity_id text,
  file_name text not null,
  storage_path text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes integer not null default 0,
  uploaded_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_evidence_company on public.evidence_files(company_id);
create index if not exists idx_evidence_activity on public.evidence_files(activity_id);

alter table public.evidence_files enable row level security;

drop policy if exists evidence_select on public.evidence_files;
create policy evidence_select on public.evidence_files
  for select using (public.is_company_member(company_id));

drop policy if exists evidence_insert on public.evidence_files;
create policy evidence_insert on public.evidence_files
  for insert with check (public.is_company_member(company_id));

drop policy if exists evidence_delete on public.evidence_files;
create policy evidence_delete on public.evidence_files
  for delete using (public.is_company_admin(company_id) or uploaded_by = auth.uid());

-- Storage bucket (run in SQL; create bucket via dashboard if this fails)
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

drop policy if exists evidence_storage_select on storage.objects;
create policy evidence_storage_select on storage.objects
  for select using (
    bucket_id = 'evidence'
    and public.is_company_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists evidence_storage_insert on storage.objects;
create policy evidence_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'evidence'
    and public.is_company_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists evidence_storage_delete on storage.objects;
create policy evidence_storage_delete on storage.objects
  for delete using (
    bucket_id = 'evidence'
    and public.is_company_member((storage.foldername(name))[1]::uuid)
  );
