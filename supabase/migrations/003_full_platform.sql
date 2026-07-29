-- Full platform C: invite accept + email lookup for pending invites
-- Run after 002_dashboard_carbon.sql

create index if not exists idx_team_invites_email_lower
  on public.team_invites (lower(email));

create index if not exists idx_team_invites_status
  on public.team_invites (status);

-- Allow invitees to see their own pending invites by email (pre-membership)
drop policy if exists team_invites_select_own_email on public.team_invites;
create policy team_invites_select_own_email on public.team_invites
  for select using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Accept the newest pending invite matching the authenticated user's email.
-- Inserts company_members, marks invite accepted, completes onboarding profile.
create or replace function public.accept_team_invite()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_invite public.team_invites%rowtype;
  v_existing_company uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(u.email, p.email)
    into v_email
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_user_id;

  if v_email is null or length(trim(v_email)) = 0 then
    return jsonb_build_object('accepted', false, 'reason', 'no_email');
  end if;

  select *
    into v_invite
  from public.team_invites
  where lower(email) = lower(v_email)
    and status = 'pending'
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('accepted', false, 'reason', 'no_invite');
  end if;

  select company_id into v_existing_company
  from public.company_members
  where user_id = v_user_id
  limit 1;

  if v_existing_company is not null and v_existing_company <> v_invite.company_id then
    return jsonb_build_object(
      'accepted', false,
      'reason', 'already_member_elsewhere',
      'company_id', v_existing_company
    );
  end if;

  if v_existing_company is null then
    insert into public.company_members (company_id, user_id, role)
    values (v_invite.company_id, v_user_id, v_invite.role);
  end if;

  update public.team_invites
  set status = 'accepted'
  where id = v_invite.id;

  update public.profiles
  set onboarding_completed = true,
      updated_at = now()
  where id = v_user_id;

  return jsonb_build_object(
    'accepted', true,
    'company_id', v_invite.company_id,
    'role', v_invite.role,
    'invite_id', v_invite.id
  );
end;
$$;

revoke all on function public.accept_team_invite() from public;
grant execute on function public.accept_team_invite() to authenticated;

-- List pending invites for the caller's company (admin/member via RLS)
create or replace function public.list_company_invites(p_company_id uuid)
returns setof public.team_invites
language sql
stable
security invoker
set search_path = public
as $$
  select *
  from public.team_invites
  where company_id = p_company_id
  order by created_at desc;
$$;

grant execute on function public.list_company_invites(uuid) to authenticated;
