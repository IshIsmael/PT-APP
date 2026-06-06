-- Self-service account deletion (store requirement). SECURITY DEFINER so it can
-- remove the caller's auth.users row, which cascades (on delete cascade) to all
-- user tables. It only ever deletes auth.uid() — a user can delete only themselves.
create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_current_user() from anon, public;
grant execute on function public.delete_current_user() to authenticated;
